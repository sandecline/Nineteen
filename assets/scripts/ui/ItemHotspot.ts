import { _decorator, Component, SpriteFrame } from 'cc';
import { RoomController } from '../Level1/RoomController';
const { ccclass, property } = _decorator;

@ccclass('ItemHotspot')
export class ItemHotspot extends Component {
  @property(RoomController)
  public room: RoomController | null = null;

  @property({ type: SpriteFrame })
  public preview: SpriteFrame | null = null;

  @property
  public description = '';

  /** Button ClickEvents 绑定这个 */
  public onClick() {
    if (!this.room) {
      console.warn('[ItemHotspot] RoomController not assigned:', this.node.name);
      return;
    }
    this.room.openInspect(this.preview ?? undefined, this.description);
  }
}