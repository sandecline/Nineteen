import { _decorator, Component, Node, UIOpacity, tween } from 'cc';
import { DialogController } from '../ui/DialogController';
import { CircleButton } from './CircleButton';
const { ccclass, property } = _decorator;

@ccclass('Level1Start')
export class Level1Start extends Component {
  @property(Node) public fadeLayer: Node | null = null;

  @property(Node) public elevatorRoot: Node | null = null; // 醒来画面
  @property(Node) public level1Root: Node | null = null;   // 第一关画面

  @property(Node) public interactionRoot: Node | null = null;

  @property(DialogController) public dialog: DialogController | null = null;

  @property(Node) public circleButtonNode: Node | null = null; // 圆形按钮节点
  @property(CircleButton) public circleButton: CircleButton | null = null;

  @property public wakeFadeDuration = 0.9;

  start() {
    // 初始：只显示 Elevator，Level1 先隐藏
    if (this.elevatorRoot) this.elevatorRoot.active = true;
    if (this.level1Root) this.level1Root.active = false;

    if (this.interactionRoot) this.interactionRoot.active = false;
    if (this.circleButtonNode) this.circleButtonNode.active = false;

    // 进场黑屏（避免 loadScene 闪屏）
    const fadeOp = this.fadeLayer?.getComponent(UIOpacity);
    if (this.fadeLayer) this.fadeLayer.active = true;
    if (fadeOp) fadeOp.opacity = 255;

    this.runSequence();
  }

  private async runSequence() {
    // 1) （可选）黑暗中旁白
    // await this.playDialogAsync([
    //   { speaker: '旁白', content: '……' },
    //   { speaker: '旁白', content: '你听见远处传来滴水声。' },
    // ]);

    // 2) 渐亮 -> 露出 Elevator
    await this.fadeFromBlack(this.wakeFadeDuration);

    // 3) Elevator 中苏醒对白
    await this.playDialogAsync([
      { speaker: '主角', content: '……我……在电梯里？' },
      { speaker: '旁白', content: '你的手边有一个圆形按钮。' },
    ]);

    // 4) 显示圆形按钮，等待玩家按下
    await this.waitForCircleButtonPress();

    // 5) 切换到 Level1 画面（不切场景）
    if (this.elevatorRoot) this.elevatorRoot.active = false;
    if (this.level1Root) this.level1Root.active = true;

    // 6) （可选）进入关卡前对白
    // await this.playDialogAsync([{ speaker: '主角', content: '开始吧。' }]);

    // 7) 开启关卡交互
    if (this.interactionRoot) this.interactionRoot.active = true;
  }

  private waitForCircleButtonPress(): Promise<void> {
    return new Promise((resolve) => {
      if (this.circleButtonNode) this.circleButtonNode.active = true;

      const btn = this.circleButton ?? this.circleButtonNode?.getComponent(CircleButton) ?? null;
      if (!btn) {
        // 没绑到按钮脚本就直接放行（避免卡死）
        resolve();
        return;
      }

      btn.setOnPressed(() => {
        if (this.circleButtonNode) this.circleButtonNode.active = false;
        resolve();
      });
    });
  }

  private playDialogAsync(lines: any[]): Promise<void> {
    return new Promise((resolve) => {
      if (!this.dialog) return resolve();
      this.dialog.play({ lines, onFinished: () => resolve() });
    });
  }

  private fadeFromBlack(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const fadeOp = this.fadeLayer?.getComponent(UIOpacity);
      if (!this.fadeLayer || !fadeOp) return resolve();

      this.fadeLayer.active = true;
      fadeOp.opacity = 255;

      tween(fadeOp)
        .to(duration, { opacity: 0 })
        .call(() => {
          if (this.fadeLayer) this.fadeLayer.active = false;
          resolve();
        })
        .start();
    });
  }
}