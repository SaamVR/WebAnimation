#!/usr/bin/env python3
"""Export any Creative Motion Lab project to MP4 using its browser timeline.

Install once: pip install playwright && playwright install chromium
Also install FFmpeg. Example:
python scripts/export_video.py --project 01-order-journey --width 1280 --fps 30
python scripts/export_video.py --project 02-living-ink --width 1920 --fps 24
python scripts/export_video.py --project 03-bloom-to-bottle --width 1920 --fps 24
"""
import argparse
import contextlib
import http.server
from pathlib import Path
import socketserver
import subprocess
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1] / 'site'
DURATION_MS = {'01-order-journey': 10200, '02-living-ink': 9000, '03-bloom-to-bottle': 11600, 'Project4': 20500, 'Project5': 22000, 'Project6': 18000, 'Project7': 20400, 'Project8': 19000, 'Project9': 21000}

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, fmt, *args):
        pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', choices=DURATION_MS, default='01-order-journey')
    parser.add_argument('--fps', type=int, default=30)
    parser.add_argument('--width', type=int, default=1280)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.fps <= 0 or args.width < 320:
        parser.error('FPS must be positive and width must be at least 320px')
    height = round(args.width * 9 / 16)
    output = args.output or Path(f'{args.project}.mp4')
    output.parent.mkdir(parents=True, exist_ok=True)
    frames = round(DURATION_MS[args.project] * args.fps / 1000)

    # Use an ephemeral localhost port. The page is rendered deterministically;
    # no animation wall-clock or headless recording lag affects the result.
    with socketserver.TCPServer(('127.0.0.1', 0), Handler) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        host = f'http://127.0.0.1:{server.server_address[1]}'
        command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                   '-f', 'image2pipe', '-vcodec', 'png', '-r', str(args.fps),
                   '-i', 'pipe:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                   '-crf', '19', '-preset', 'medium', '-movflags', '+faststart', str(output)]
        pipe = subprocess.Popen(command, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            with sync_playwright() as pw:
                browser = pw.chromium.launch(headless=True, args=['--disable-dev-shm-usage'])
                page = browser.new_page(viewport={'width': args.width, 'height': height}, device_scale_factor=1)
                route = f'/Project{args.project[-1]}/?preview=1' if args.project.startswith('Project') else f'/projects/{args.project}/?render=1'
                page.goto(f'{host}{route}', wait_until='load')
                page.wait_for_function('window.motionReady === true')
                for i in range(frames):
                    page.evaluate('(ms) => window.renderAt(ms)', i * 1000 / args.fps)
                    pipe.stdin.write(page.screenshot(type='png', animations='disabled'))
                    if i % max(1, args.fps * 2) == 0:
                        print(f'{i}/{frames} frames', flush=True)
                browser.close()
            pipe.stdin.close()
            error = pipe.stderr.read().decode('utf-8', errors='replace')
            if pipe.wait() != 0:
                raise RuntimeError(error)
            print(f'Exported {output} ({args.width}x{height} / {args.fps}fps)')
        except Exception:
            if pipe.poll() is None:
                pipe.kill()
            raise
        finally:
            server.shutdown()

if __name__ == '__main__':
    main()
