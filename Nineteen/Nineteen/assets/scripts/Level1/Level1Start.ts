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
  // 0) 强制黑幕（保证后面第1段对话一定发生在黑里）
  this.forceBlack();

  // 1) 黑暗中旁白
  await this.playDialogAsync([
    { speaker: '旁白', content: ['……', '不知过了多久，主角悠悠转醒'] },
    { speaker: '主角', content: ['发生了什么？这是哪？...'] },
  ]);

  // 2) 渐亮 -> 露出 Elevator
  await this.fadeFromBlack(this.wakeFadeDuration);

  // 3) Elevator 中苏醒对白
  await this.playDialogAsync([
    {
      speaker: '主角',
      content: [
        '……我……在电梯里？我记得...我登入了那个十九层游戏...',
        '可是这游戏怎么会这么真实，这可不是一般游戏厂商能够做出来的游戏',
        '到底发生了什么...',
      ],
    },
    {
      speaker: '旁白',
      content: [
        '此时的主角发现自己正处在一个装潢老式破旧的电梯里面',
        '主角发现自己身穿蓝白病号服，脖子上还用红绳挂着一个造型古朴的无名牌',
        '右边本该是连串的电梯按钮，只剩下一个红色的十九层按钮',
        '主角简单检查了一番电梯，发现厢体好像在微微摇晃，就像是被挂在高空之中一样',
        '目前除了按下按钮好像也没有其他选择了',
        '猛的主角感到胸前的无名牌好像在微微发热，于是拿起来查看',
        '随着一阵光芒微闪，无字牌上浮现了些许小字：',
        '“按下按钮”',
      ],
    },
    { speaker: '主角', content: ['这无名牌也在让我按下按钮，看来目前只能试试看了'] },
  ]);

  // 4) 等按钮
  await this.waitForCircleButtonPress();

  // 5) 切换到 Level1Root
  if (this.elevatorRoot) this.elevatorRoot.active = false;
  if (this.level1Root) this.level1Root.active = true;

  // 6) 开启交互
  if (this.interactionRoot) this.interactionRoot.active = true;
}

private forceBlack() {
  const fadeOp = this.fadeLayer?.getComponent(UIOpacity);
  if (!this.fadeLayer || !fadeOp) {
    console.warn('[Level1Start] forceBlack: fadeLayer or UIOpacity missing');
    return;
  }
  this.fadeLayer.active = true;
  fadeOp.opacity = 255;
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