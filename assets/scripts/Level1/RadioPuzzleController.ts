import { _decorator, Component, Label, Node, SpriteFrame, find, tween, Vec3 } from 'cc';
import { DialogLineInput } from '../ui/DialogController';
import { RoomController } from './RoomController';
import { InspectLayerController } from './InspectLayerController';

const { ccclass, property } = _decorator;

@ccclass('RadioPuzzleController')
export class RadioPuzzleController extends Component {
  @property(RoomController)
  public room: RoomController | null = null;

  @property(InspectLayerController)
  public inspect: InspectLayerController | null = null;

  /** 收音机的放大图（InspectLayer 展示） */
  @property({ type: SpriteFrame })
  public radioSprite: SpriteFrame | null = null;

  /** 收音机描述 */
  @property
  public radioDescription = '一台老式收音机，上面有一个调频旋钮。';

  /** 正确频率（MHz） */
  @property
  public targetFrequency = 7.30;

  /** 调频最小值（MHz） */
  @property
  public minFrequency = 5.0;

  /** 调频最大值（MHz） */
  @property
  public maxFrequency = 10.0;

  /** 每次点击旋钮调整的步进值（MHz） */
  @property
  public frequencyStep = 0.10;

  /** 当前频率 */
  private currentFrequency = 5.0;

  /** 首次打开收音机时播放的对话（每项是一段完整对话内容） */
  @property({ type: [String] })
  public firstOpenDialogContents: string[] = [];

  /** 调到正确频率时播放的对话内容（4段经文） */
  @property({ type: [String] })
  public solvedDialogContents: string[] = [];

  /** 调到正确频率时播放的对话（4段经文） */
  public get solvedDialogLines(): DialogLineInput[] {
    return this.solvedDialogContents.map(c => ({ content: c }));
  }

  /** 首次打开收音机时播放的对话 */
  public get firstOpenDialogLines(): DialogLineInput[] {
    return this.firstOpenDialogContents.map(c => ({ content: c }));
  }

  /** 测试播放解谜对话（在编辑器中调用） */
  public testPlaySolvedDialog() {
    console.log('[RadioPuzzleController] Testing solved dialog...');
    if (this.room) {
      this.room.playDialogAsync(this.solvedDialogLines);
    } else {
      console.warn('Room not assigned!');
    }
  }

  /**
   * 安全播放对话：播放期间禁用 InspectLayer 关闭，防止打断
   */
  private async playDialogSafely(lines: DialogLineInput[]) {
    if (!this.room) return;

    // 禁用关闭，防止打断
    this.inspect?.setClosable(false);

    try {
      await this.room.playDialogAsync(lines);
    } finally {
      // 恢复关闭功能
      this.inspect?.setClosable(true);
    }
  }

  /** 频率显示 Label（放在 InspectLayer/Panel 中） */
  @property(Label)
  public frequencyLabel: Label | null = null;

  /** 调频按钮容器（在 InspectLayer/Panel 中） */
  @property(Node)
  public tuningButtonsRoot: Node | null = null;

  /** 状态提示 Label */
  @property(Label)
  public statusLabel: Label | null = null;

  private solved = false;
  private firstOpened = false;

  /** 当前输入的数字字符串 */
  private inputBuffer = '';

  /** 输入超时定时器 */
  private inputTimeout: number | null = null;

  start() {
    this.tryAutoBindRefs();
    this.currentFrequency = this.minFrequency;
    this.refreshFrequencyDisplay();
  }

  /** Wall_Left 热点点击后调用 */
  public openFromWallLeft() {
    this.tryAutoBindRefs();

    if (this.solved) {
      // 已解谜，展示收音机并播放对话
      this.room?.openInspect(this.radioSprite ?? undefined, this.radioDescription);
      this.updateStatus('收音机正在播放中...');
      this.updateFrequencyDisplay();
      // 每次打开都播放对话（锁定 InspectLayer 防止打断）
      if (this.solvedDialogLines.length > 0) {
        this.playDialogSafely(this.solvedDialogLines);
      }
      return;
    }

    let openedByRoom = false;
    if (this.room) {
      this.room.openInspect(this.radioSprite ?? undefined, this.radioDescription);
      openedByRoom = !!this.room.inspect;
    }

    if (!openedByRoom) {
      const inspect = this.resolveInspect();
      if (!inspect) {
        console.warn('[RadioPuzzleController] RoomController/InspectLayerController not assigned.');
        return;
      }
      inspect.show(this.radioSprite ?? undefined, this.radioDescription);
    }

    this.resetVisualState();
    this.refreshFrequencyDisplay();

    if (!this.firstOpened && this.firstOpenDialogLines.length > 0 && this.room) {
      this.firstOpened = true;
      this.waitForInspectClosed().then(() => {
        this.room?.playDialogAsync(this.firstOpenDialogLines);
      });
    }
  }

  /** 点击 + 按钮：频率升高 */
  public onClickTuneUp() {
    if (this.solved) return;
    this.currentFrequency = Math.min(
      this.maxFrequency,
      parseFloat((this.currentFrequency + this.frequencyStep).toFixed(2))
    );
    this.refreshFrequencyDisplay();
    this.onFrequencyChanged();
  }

  /** 点击 - 按钮：频率降低 */
  public onClickTuneDown() {
    if (this.solved) return;
    this.currentFrequency = Math.max(
      this.minFrequency,
      parseFloat((this.currentFrequency - this.frequencyStep).toFixed(2))
    );
    this.refreshFrequencyDisplay();
    this.onFrequencyChanged();
  }

  /** 点击细调 + 按钮 */
  public onClickTuneUpFine() {
    if (this.solved) return;
    this.currentFrequency = Math.min(
      this.maxFrequency,
      parseFloat((this.currentFrequency + this.frequencyStep * 0.1).toFixed(2))
    );
    this.refreshFrequencyDisplay();
    this.onFrequencyChanged();
  }

  /** 点击细调 - 按钮 */
  public onClickTuneDownFine() {
    if (this.solved) return;
    this.currentFrequency = Math.max(
      this.minFrequency,
      parseFloat((this.currentFrequency - this.frequencyStep * 0.1).toFixed(2))
    );
    this.refreshFrequencyDisplay();
    this.onFrequencyChanged();
  }

  /** 点击数字按钮（0-9） */
  public onClickDigit(event: Event, customEventData: string) {
    if (this.solved) return;

    // 清除之前的超时
    if (this.inputTimeout !== null) {
      clearTimeout(this.inputTimeout);
    }

    // 最多输入4位数字（支持如 7.30 或 10.00）
    if (this.inputBuffer.length >= 4) {
      this.updateStatus('输入已满，请按 # 确认或 * 清除');
      return;
    }

    // 添加数字
    this.inputBuffer += customEventData;

    // 实时显示输入
    const displayStr = this.inputBuffer + ' MHz';
    if (this.frequencyLabel) {
      this.frequencyLabel.string = displayStr;
    }

    // 如果输入了2位或4位数字，自动在合适位置插入小数点显示
    if (this.inputBuffer.length === 2) {
      this.updateStatus(`输入: ${this.inputBuffer}.__ MHz`);
    } else if (this.inputBuffer.length === 3) {
      this.updateStatus(`输入: ${this.inputBuffer[0]}.${this.inputBuffer.substring(1)} MHz`);
    } else if (this.inputBuffer.length === 4) {
      this.updateStatus(`输入: ${this.inputBuffer.substring(0, 2)}.${this.inputBuffer.substring(2)} MHz`);
    } else {
      this.updateStatus(`输入: ${this.inputBuffer}._ MHz`);
    }

    // 设置5秒超时，超时后自动清除输入
    this.inputTimeout = setTimeout(() => {
      if (this.inputBuffer.length > 0) {
        this.updateStatus('输入超时，已清除');
        this.inputBuffer = '';
        this.refreshFrequencyDisplay();
        this.inputTimeout = null;
      }
    }, 5000) as unknown as number;
  }

  /** 点击 * 按钮：清除输入 */
  public onClickStar() {
    if (this.solved) return;

    // 清除超时
    if (this.inputTimeout !== null) {
      clearTimeout(this.inputTimeout);
      this.inputTimeout = null;
    }

    this.inputBuffer = '';
    this.updateStatus('输入已清除');
    this.refreshFrequencyDisplay();
  }

  /** 点击 # 按钮：确认输入频率 */
  public onClickHash() {
    if (this.solved) return;

    // 清除超时
    if (this.inputTimeout !== null) {
      clearTimeout(this.inputTimeout);
      this.inputTimeout = null;
    }

    if (this.inputBuffer.length === 0) {
      this.updateStatus('请先输入频率数字');
      return;
    }

    // 将输入转换为频率值
    let newFreq: number;
    if (this.inputBuffer.length === 1) {
      // 单数字视为小数，如 "7" -> 7.00
      newFreq = parseFloat(this.inputBuffer) * 1.0;
    } else if (this.inputBuffer.length === 2) {
      // 两位数视为整数部分，如 "73" -> 7.30（默认加.00）
      newFreq = parseFloat(this.inputBuffer) * 1.0;
    } else if (this.inputBuffer.length === 3) {
      // 三位数：第一位是整数，后面是小数，如 "730" -> 7.30
      newFreq = parseFloat(this.inputBuffer[0] + '.' + this.inputBuffer.substring(1));
    } else {
      // 四位数：前两位是整数，后两位是小数，如 "0730" -> 7.30 或 "1000" -> 10.00
      newFreq = parseFloat(this.inputBuffer.substring(0, 2) + '.' + this.inputBuffer.substring(2));
    }

    // 清空输入
    this.inputBuffer = '';

    // 检查频率是否在有效范围内
    if (newFreq < this.minFrequency || newFreq > this.maxFrequency) {
      this.updateStatus(`频率 ${newFreq.toFixed(2)} MHz 超出范围 (${this.minFrequency}-${this.maxFrequency})`);
      this.refreshFrequencyDisplay();
      return;
    }

    // 应用新频率
    this.currentFrequency = parseFloat(newFreq.toFixed(2));
    this.refreshFrequencyDisplay();
    this.updateStatus(`频率已设置为 ${this.currentFrequency.toFixed(2)} MHz`);
    this.onFrequencyChanged();
  }

  private onFrequencyChanged() {
    const diff = Math.abs(this.currentFrequency - this.targetFrequency);
    console.log(`[RadioPuzzle] Current: ${this.currentFrequency}, Target: ${this.targetFrequency}, Diff: ${diff}`);

    if (diff < 0.001) {
      // 精确匹配（放宽精度要求到0.01）→ 解谜成功
      this.onSolved();
    } else if (diff < 0.3) {
      this.updateStatus('滋...滋...似乎快接近某个频道了...');
    } else if (diff < 1.0) {
      this.updateStatus('收音机发出断断续续的杂音...');
    } else {
      this.updateStatus('沙沙沙...只有杂音...');
    }
  }

  private onSolved() {
    this.solved = true;

    // 隐藏调频按钮
    if (this.tuningButtonsRoot) {
      this.tuningButtonsRoot.active = false;
    }

    this.updateStatus('信号清晰了！收音机开始播放一段广播...');

    // 隐藏调频相关 UI，只保留状态
    if (this.frequencyLabel) {
      this.frequencyLabel.string = `${this.targetFrequency.toFixed(2)} MHz`;
    }

    // 立即播放对话（锁定 InspectLayer 防止打断）
    if (this.solvedDialogLines.length > 0) {
      this.playDialogSafely(this.solvedDialogLines);
    }
  }

  // ===== 显示更新 =====

  private refreshFrequencyDisplay() {
    this.updateFrequencyDisplay();
  }

  private updateFrequencyDisplay() {
    if (this.frequencyLabel) {
      this.frequencyLabel.string = `${this.currentFrequency.toFixed(2)} MHz`;
    }
  }

  private updateStatus(msg: string) {
    if (this.statusLabel) {
      this.statusLabel.string = msg;
    }
  }

  private resetVisualState() {
    if (this.tuningButtonsRoot) {
      this.tuningButtonsRoot.active = true;
    }
    if (this.statusLabel) {
      this.statusLabel.string = '';
    }
    this.currentFrequency = this.minFrequency;
  }

  // ===== 工具方法 =====

  private resolveInspect(): InspectLayerController | null {
    this.tryAutoBindRefs();

    if (this.inspect) return this.inspect;
    if (this.room?.inspect) {
      this.inspect = this.room.inspect;
      return this.inspect;
    }
    return null;
  }

  private tryAutoBindRefs() {
    if (!this.room) {
      const roomNode = find('Canvas/Level1Root') ?? find('Level1Root');
      this.room = roomNode?.getComponent(RoomController) ?? null;
    }

    if (!this.inspect && this.room?.inspect) {
      this.inspect = this.room.inspect;
    }

    if (!this.inspect) {
      const inspectNode =
        find('Canvas/Level1Root/InspectLayer') ??
        find('Canvas/InspectLayer') ??
        find('InspectLayer');
      this.inspect = inspectNode?.getComponent(InspectLayerController) ?? null;
    }
  }

  private waitForInspectClosed(): Promise<void> {
    return new Promise((resolve) => {
      const inspect = this.resolveInspect();
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
