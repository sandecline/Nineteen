import { _decorator, Component, Sprite, SpriteFrame, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('InspectLayerController')
export class InspectLayerController extends Component {
  @property(Sprite) public image: Sprite | null = null;
  @property(Label) public text: Label | null = null;

  /** 可选：由外部注入，用来通知“已关闭” */
  public onClosed: (() => void) | null = null;

  public show(spriteFrame?: SpriteFrame, description?: string) {
    this.node.active = true;
    if (this.image && spriteFrame) this.image.spriteFrame = spriteFrame;
    if (this.text) this.text.string = description ?? '';
  }

  public hide() {
    this.node.active = false;
    this.onClosed?.();
  }

  public hideInstant() {
    this.node.active = false;
  }

  public onClickClose() {
    this.hide();
  }
}