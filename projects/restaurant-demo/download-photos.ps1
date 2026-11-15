$ErrorActionPreference='Continue'
$dest='F:\Zestry-Restaurant-Demo-20261116\projects\restaurant-demo\assets\photos'
$items=@(
  @('pasta','photo-1473093295043-cdd812d0e601'),
  @('burger','photo-1568901346375-23c9450c58cd'),
  @('salad','photo-1512621776951-a57141f2eefd'),
  @('cake','photo-1578985545062-69928b1d9587'),
  @('pancakes','photo-1528207776546-365bb710ee93'),
  @('coffee','photo-1509042239860-f550ce710b93'),
  @('lemonade','photo-1513558161293-cdaf765edfd4'),
  @('toast','photo-1541519227354-08fa5d50c44d'),
  @('restaurant','photo-1517248135467-4c7edcad34c4')
)
foreach($item in $items){
  $name=$item[0];$id=$item[1]
  $url="https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=82"
  try{Invoke-WebRequest -Uri $url -OutFile "$dest\$name.jpg" -UseBasicParsing -TimeoutSec 35
   $bytes=(Get-Item "$dest\$name.jpg").Length
   Write-Output "$name $bytes"}
  catch {Write-Output ("FAILED "+$name+" "+$_.Exception.Message)}
}
