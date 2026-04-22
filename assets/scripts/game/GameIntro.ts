import { _decorator, Component, Node, director, Sprite, Color, UIOpacity, tween } from 'cc';
import { DialogController } from '../ui/DialogController';
const { ccclass, property } = _decorator;

@ccclass('GameIntro')
export class GameIntro extends Component {
  /** 黑幕层（最上层节点，挂 UIOpacity；建议同节点也挂 Sprite 以支持“闪白”） */
  @property(Node)
  public fadeLayer: Node | null = null;

  /** 背景根节点（RoomRoot，挂 UIOpacity） */
  @property(Node)
  public roomRoot: Node | null = null;

  /** UI 根节点（UIRoot，挂 UIOpacity） */
  @property(Node)
  public uiRoot: Node | null = null;

  /** 可交互根节点（InteractionRoot，建议初始 active=false） */
  @property(Node)
  public interactionRoot: Node | null = null;

  /** 对话控制器（挂在 DialogLayer 上的 DialogController 组件） */
  @property(DialogController)
  public dialog: DialogController | null = null;

  /** 黑幕淡出 + 背景浮现时长（秒） */
  @property
  public fadeDuration = 1.2;

  /** UI 淡入时长（秒） */
  @property
  public uiFadeDuration = 0.6;

  /** 晕倒过场：闪白时长（秒） */
  @property
  public flashDuration = 0.14;

  /** 晕倒过场：渐黑时长（秒） */
  @property
  public faintFadeToBlackDuration = 0.7;

  /** 第一关场景名（不带 .scene） */
  @property
  public level1SceneName = 'Level1';

  start() {
  this.playIntroSequence();
}

  private playIntroSequence() {
    const fadeOp = this.fadeLayer?.getComponent(UIOpacity);
    const roomOp = this.roomRoot?.getComponent(UIOpacity);
    const uiOp = this.uiRoot?.getComponent(UIOpacity);

    if (!fadeOp || !roomOp || !uiOp) {
      console.warn(
        'GameIntro: 缺少组件。请检查 fadeLayer/roomRoot/uiRoot 是否都已绑定，并且都挂了 UIOpacity。'
      );
      return;
    }

    // --- 初始状态：黑屏，背景&UI隐藏，禁止交互 ---
    if (this.fadeLayer) this.fadeLayer.active = true;
    fadeOp.opacity = 255;

    roomOp.opacity = 0;
    uiOp.opacity = 0;

    if (this.interactionRoot) this.interactionRoot.active = false;

    // --- B 方案：黑幕淡出 与 背景淡入 同时进行 ---
    tween(fadeOp).to(this.fadeDuration, { opacity: 0 }).start();

    tween(roomOp)
      .to(this.fadeDuration, { opacity: 255 })
      .call(() => {
        // 黑幕淡完后隐藏掉，避免挡点击/挡UI
        if (this.fadeLayer) this.fadeLayer.active = false;

        // --- UI 淡入 ---
        tween(uiOp)
          .to(this.uiFadeDuration, { opacity: 255 })
          .call(() => {
            // UI 完全出现后，播放开场文本；文本结束才允许操作
            this.playIntroDialogOrEnableInteraction();
          })
          .start();
      })
      .start();
  }

  private playIntroDialogOrEnableInteraction() {
    // 如果你还没做对话框，或者没绑定 dialog，就直接开启交互
    if (!this.dialog) {
      if (this.interactionRoot) this.interactionRoot.active = true;
      return;
    }

    // 对话期间禁止交互
    if (this.interactionRoot) this.interactionRoot.active = false;

    this.dialog.play({
      lines: [
        {
          speaker: '主角',
          content: [
            '嗯...我看看，这个从二手市场上面低价买来的设备...',
            '哦哦！居然还可以开机！我看看都有什么...',
            '“十九层”？这是什么游戏，我怎么没听过？',
          ],
        },
        {
          speaker: '旁白',
          content: '主角尝试在网络上搜索“十九层”，但是没有搜到什么有用信息，最多也只是一些语焉不详的提及',
        },
        {
          speaker: '主角',
          content: '好奇怪的游戏，像是都市传说一样，我来看看怎么个事',
        },
        {
          speaker: '旁白',
          content: [
            '主角在好奇心的驱使下带上了设备',
            '伴随着“滴滴滴”的设备启动声，主角登入了游戏',
            '突然一瞬间主角感觉自己的大脑遭受了重击，随即意识下潜晕了过去',
          ],
        },
      ],
      onFinished: () => {
        this.runFaintAndLoadLevel1();
      },
    });
  }

  /** 晕倒过场：屏幕一闪 -> 黑下去 -> 切到 Level1.scene */
  public async runFaintAndLoadLevel1() {
    if (this.interactionRoot) this.interactionRoot.active = false;

    // 确保遮罩可用
    const fadeOp = this.fadeLayer?.getComponent(UIOpacity);
    if (!this.fadeLayer || !fadeOp) {
      console.warn('GameIntro: fadeLayer 或其 UIOpacity 缺失，无法执行晕倒过场，直接切���景。');
      director.loadScene(this.level1SceneName);
      return;
    }

    // 1) 闪白（需要 Sprite 才能真正变白；如果没有 Sprite，就只做一次 opacity 闪烁）
    await this.flashWhite(this.flashDuration);

    // 2) 渐黑并保持全黑
    await this.fadeToBlack(this.faintFadeToBlackDuration);

    // 3) 切场景（Level1.scene 里要有自己的 FadeLayer，且初始保持黑）
    director.loadScene(this.level1SceneName);
  }

  private flashWhite(duration = 0.14): Promise<void> {
    return new Promise((resolve) => {
      const op = this.fadeLayer?.getComponent(UIOpacity);
      if (!this.fadeLayer || !op) return resolve();

      this.fadeLayer.active = true;

      const sp = this.fadeLayer.getComponent(Sprite);
      if (sp) sp.color = new Color(255, 255, 255, 255);

      // 从透明快速到全白，再回到透明
      op.opacity = 0;
      tween(op)
        .to(duration * 0.25, { opacity: 255 })
        .to(duration * 0.75, { opacity: 0 })
        .call(() => resolve())
        .start();
    });
  }

  private fadeToBlack(duration = 0.7): Promise<void> {
    return new Promise((resolve) => {
      const op = this.fadeLayer?.getComponent(UIOpacity);
      if (!this.fadeLayer || !op) return resolve();

      this.fadeLayer.active = true;

      const sp = this.fadeLayer.getComponent(Sprite);
      if (sp) sp.color = new Color(0, 0, 0, 255);

      tween(op)
        .to(duration, { opacity: 255 })
        .call(() => resolve())
        .start();
    });
  }
}