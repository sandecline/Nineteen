import {
  _decorator,
  Component,
  Node,
  Label,
  input,
  Input,
  EventTouch,
  UIOpacity,
  tween,
} from 'cc';
const { ccclass, property } = _decorator;

export type DialogLineInput = {
  speaker?: string;
  content: string | string[];
};

type DialogLine = {
  speaker?: string;
  content: string;
};

@ccclass('DialogController')
export class DialogController extends Component {
  /** 整个对话框背景节点（半透明底） */
  @property(Node)
  public dialogBox: Node | null = null;

  /** 顶部 speaker 条（可选：用来做 speaker 变化的小动画） */
  @property(Node)
  public speakerBar: Node | null = null;

  @property(Label)
  public speakerLabel: Label | null = null;

  @property(Label)
  public contentLabel: Label | null = null;

  /** “下一句提示”节点（右下角箭头/点点），没有也能跑 */
  @property(Node)
  public nextIndicator: Node | null = null;

  /** 打字机速度：每秒字符数（0 表示不开启打字机） */
  @property
  public charsPerSecond = 30;

  /** 对话框淡入后的目标透明度（0-255） */
  @property
  public boxOpacity = 180;

  private lines: DialogLine[] = [];
  private index = 0;
  private onFinished: (() => void) | null = null;
  private playing = false;

  // 打字机状态
  private typing = false;
  private fullText = '';
  private shownCount = 0;

  // speaker 状态（用于“同 speaker 不闪/不重复动画”）
  private lastSpeaker: string = '';

  // 指示器闪烁 tween
  private indicatorTween: any = null;

  onEnable() {
    input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
  }

  onDisable() {
    input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    this.stopIndicatorBlink();
    this.unschedule(this.tickTyping);
  }

  /** 开始播放 */
  public play(params: { lines: DialogLineInput[]; onFinished?: () => void }) {
    this.lines = this.flatten(params.lines ?? []);
    this.index = 0;
    this.onFinished = params.onFinished ?? null;
    this.playing = true;

    this.lastSpeaker = '';
    this.typing = false;
    this.fullText = '';
    this.shownCount = 0;

    if (this.speakerLabel) this.speakerLabel.string = '';
    if (this.contentLabel) this.contentLabel.string = '';

    // 初始隐藏指示器
    this.hideIndicator();

    // 显示对话层
    this.node.active = true;

    // 对话框淡入
    if (this.dialogBox) {
      const op = this.dialogBox.getComponent(UIOpacity) ?? this.dialogBox.addComponent(UIOpacity);
      op.opacity = 0;
      tween(op).to(0.18, { opacity: this.boxOpacity }).start();
    }

    // speakerBar 确保有 opacity（可选）
    if (this.speakerBar) {
      const op = this.speakerBar.getComponent(UIOpacity) ?? this.speakerBar.addComponent(UIOpacity);
      if (op.opacity <= 0) op.opacity = 255;
    }

    this.showCurrentLine();
  }

  /** 把 content(string|string[]) 拍平成逐句播放 */
  private flatten(inputs: DialogLineInput[]): DialogLine[] {
    const out: DialogLine[] = [];
    for (const it of inputs) {
      if (Array.isArray(it.content)) {
        for (const s of it.content) out.push({ speaker: it.speaker, content: s });
      } else {
        out.push({ speaker: it.speaker, content: it.content });
      }
    }
    return out;
  }

  private showCurrentLine() {
    if (this.index >= this.lines.length) {
      this.finish();
      return;
    }

    const line = this.lines[this.index];

    // 句子切换时先隐藏提示（因为要么开始打字，要么换句）
    this.hideIndicator();

    // 1) speaker：仅当变化时更新 + 可选小动画
    const sp = (line.speaker ?? '').trim();
    if (sp !== this.lastSpeaker) {
      this.lastSpeaker = sp;
      if (this.speakerLabel) this.speakerLabel.string = sp;

      if (this.speakerBar) {
        const op = this.speakerBar.getComponent(UIOpacity) ?? this.speakerBar.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.12, { opacity: 255 }).start();
      }
    }

    // 2) content：打字机
    this.startTyping(line.content);
  }

  private startTyping(text: string) {
    this.fullText = text ?? '';
    this.shownCount = 0;

    if (!this.contentLabel) return;

    // 不启用打字机：整句显示 + 直接显示提示
    if (this.charsPerSecond <= 0) {
      this.typing = false;
      this.contentLabel.string = this.fullText;
      this.showIndicatorIfNeeded();
      return;
    }

    this.typing = true;
    this.contentLabel.string = '';

    this.unschedule(this.tickTyping);
    this.schedule(this.tickTyping, 0);
  }

  private tickTyping = (dt: number) => {
    if (!this.typing || !this.contentLabel) return;

    const add = Math.max(1, Math.floor(this.charsPerSecond * dt));
    this.shownCount = Math.min(this.fullText.length, this.shownCount + add);

    this.contentLabel.string = this.fullText.slice(0, this.shownCount);

    // 打完了：停止打字，显示“下一句提示”
    if (this.shownCount >= this.fullText.length) {
      this.typing = false;
      this.unschedule(this.tickTyping);
      this.showIndicatorIfNeeded();
    }
  };

  private onTouchEnd(_e: EventTouch) {
    if (!this.playing) return;

    // 打字中：点击=立刻显示整句（不进入下一句）
    if (this.typing) {
      this.typing = false;
      this.unschedule(this.tickTyping);
      if (this.contentLabel) this.contentLabel.string = this.fullText;
      this.showIndicatorIfNeeded();
      return;
    }

    // 当前句已完整显示：点击=下一句
    this.index++;
    this.showCurrentLine();
  }

  /** 是否需要显示指示器（最后一句也可以显示，或你想最后一句不显示可在这里改） */
  private showIndicatorIfNeeded() {
    // 如果已经是最后一句，你也可以选择不显示提示：
    // if (this.index >= this.lines.length - 1) return;

    if (!this.nextIndicator) return;

    this.nextIndicator.active = true;

    const op = this.nextIndicator.getComponent(UIOpacity) ?? this.nextIndicator.addComponent(UIOpacity);
    op.opacity = 255;

    this.startIndicatorBlink();
  }

  private hideIndicator() {
    if (!this.nextIndicator) return;
    this.stopIndicatorBlink();
    this.nextIndicator.active = false;
  }

  private startIndicatorBlink() {
    if (!this.nextIndicator) return;

    const op = this.nextIndicator.getComponent(UIOpacity) ?? this.nextIndicator.addComponent(UIOpacity);
    this.stopIndicatorBlink();

    // 简单闪烁：255 -> 80 -> 255 循环
    this.indicatorTween = tween(op)
      .repeatForever(
        tween(op)
          .to(0.35, { opacity: 80 })
          .to(0.35, { opacity: 255 })
      )
      .start();
  }

  private stopIndicatorBlink() {
    if (this.indicatorTween) {
      this.indicatorTween.stop?.();
      this.indicatorTween = null;
    }
  }

  private finish() {
    this.playing = false;
    this.typing = false;
    this.unschedule(this.tickTyping);
    this.hideIndicator();

    if (this.dialogBox) {
      const op = this.dialogBox.getComponent(UIOpacity);
      if (op) {
        tween(op)
          .to(0.16, { opacity: 0 })
          .call(() => {
            this.node.active = false;
            this.onFinished?.();
          })
          .start();
        return;
      }
    }

    this.node.active = false;
    this.onFinished?.();
  }
}