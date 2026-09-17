import { _decorator, Component, SpriteFrame } from 'cc';
import { DialogLineInput } from './DialogController';
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

  /** 查看完物品后播放的对话（占位，可在编辑器中配置） */
  @property([DialogLineInput])
  public afterInspectDialogLines: DialogLineInput[] = [];

  /** Button ClickEvents 绑定这个 */
  public onClick() {
    if (!this.room) {
      console.warn('[ItemHotspot] RoomController not assigned:', this.node.name);
      return;
    }
    this.room.openInspect(this.preview ?? undefined, this.description);

    // 先看图片，关闭 InspectLayer 后再播放对话
    if (this.afterInspectDialogLines.length > 0) {
      this.waitForInspectClosed().then(() => {
        this.room?.playDialogAsync(this.afterInspectDialogLines);
      });
    }
  }

  /** 等待 InspectLayer 被关闭 */
  private waitForInspectClosed(): Promise<void> {
    return new Promise((resolve) => {
      const inspect = this.room?.inspect;
      if (!inspect || !inspect.node.active) {
        resolve();
        return;
      }
      const prevClosed = inspect.onClosed;
      inspect.onClosed = () => {
        inspect.onClosed = prevClosed;
        prevClosed?.();
        resolve();
      };
    });
  }
}