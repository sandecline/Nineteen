import { _decorator, Component, Node, Sprite, SpriteFrame, Label, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('InspectLayerController')
export class InspectLayerController extends Component {
  @property(Sprite) public image: Sprite | null = null;
  @property(Label) public text: Label | null = null;

  /** 可选：由外部注入，用来通知"已关闭" */
  public onClosed: (() => void) | null = null;

  /** 是否可关闭（播放对话时设为 false 防止打断） */
  private _closable = true;

  /** Panel 节点引用（需要在编辑器中绑定或通过名称查找） */
  private _panel: Node | null = null;

  start() {
    // 尝试通过名称查找 Panel
    this._panel = this.node.getChildByName('Panel') || null;
    if (!this._panel) {
      console.warn('[InspectLayerController] Panel 节点未找到！');
    }
  }

  public show(spriteFrame?: SpriteFrame, description?: string) {
    console.log('[InspectLayerController] show() 被调用');
    console.log('  spriteFrame:', spriteFrame ? '已传入' : '为空');
    console.log('  description:', description);

    this.node.active = true;

    // 确保 Panel 存在且有正确的大小
    if (this._panel) {
      const transform = this._panel.getComponent(UITransform);
      if (transform) {
        // 如果尺寸太小或无效，设置为合适的大小
        const size = transform.contentSize;
        console.log('  Panel 当前尺寸:', size.width, 'x', size.height);
        if (size.width < 100 || size.height < 100) {
          transform.setContentSize(800, 600);
          console.log('  Panel 尺寸已调整为: 800 x 600');
        }
      }

      // 确保 Panel 可见
      this._panel.active = true;
    }

    // 设置图片
    if (this.image) {
      this.image.node.active = true;
      if (spriteFrame) {
        this.image.spriteFrame = spriteFrame;
      }
    } else {
      console.log('  警告: image 属性未绑定');
    }

    // 设置文字
    if (this.text) {
      this.text.node.active = true;
      if (description !== undefined) {
        this.text.string = description;
      }
    } else {
      console.log('  警告: text 属性未绑定');
    }

    console.log('  InspectLayer 显示完成');
  }

  public hide() {
    if (!this._closable) return;
    this.node.active = false;
    this.onClosed?.();
  }

  public hideInstant() {
    this.node.active = false;
  }

  public onClickClose() {
    if (!this._closable) return;
    this.hide();
  }

  public onClickMask() {
    if (!this._closable) return;
    this.hide();
  }

  /** 设置是否可关闭（播放对话时设为 false） */
  public setClosable(closable: boolean) {
    this._closable = closable;
  }
}