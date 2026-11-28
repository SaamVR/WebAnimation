function catalogBuild(){
 const fits=['Regular Tee','Drop Shoulder','Tie-Dye'];
 const arts=['Line Study','City Marks','Ink Notebook','Paper Sketch','Hand-Dyed Form','Block Texture','Studio Type','Everyday Print'];
 const catalog=Array.from({length:64},(_,i)=>{
  const number=i+1;
  const type=fits[i%3];
  const audience=i%5===0?['men','women']:i%2===0?['women']:['men'];
  const categories=[type==='Tie-Dye'?'tie-dye':type==='Drop Shoulder'?'drop-shoulder':'regular-tees'];
  // Multidimensional categorization is not exclusive.
  if(i%4===0&&!categories.includes('tie-dye'))categories.push('tie-dye');
  if(i%6===0&&!categories.includes('drop-shoulder'))categories.push('drop-shoulder');
  const print=i%4===0?'hand-dyed':i%3===0?'illustration':'studio-print';
  return {id:'study-'+String(number).padStart(3,'0'),name:'Studio Sample '+String(number).padStart(2,'0'),subtitle:arts[i%arts.length],fit:type,category:categories,audience,print,price:null,visual:i%7,featured:i<5};
 });
 return catalog;
}
export const catalog = catalogBuild();
export const PAGE_SIZE_HOME = 8;
export const PAGE_SIZE_SHOP = 12;
export {journalArticles as articlePreviews} from './journal-content-v1.mjs';
