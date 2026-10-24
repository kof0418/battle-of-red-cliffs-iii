import Phaser from 'phaser';
/** Small textures stay below mobile GPU limits; only the current stage is retained. */
import {sceneryTiles} from './scenery-plan';
export function cacheScenery(scene:Phaser.Scene,source:Phaser.GameObjects.Container,width:number){
 const result=scene.add.container(0,0).setDepth(-100);
 try{
  for(const tile of sceneryTiles(width)){
   const image=scene.add.renderTexture(tile.x,0,tile.width,540).setOrigin(0);
   result.add(image);image.draw(source,-tile.x,0);
  }
  source.destroy(true);return result;
 }catch{/* Keep vector scenery if the renderer cannot allocate a cache. */result.destroy(true);return source;}
}
