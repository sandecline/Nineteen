import { _decorator, Component, Label, Node, SpriteFrame, find } from 'cc';
import { DialogLineInput } from '../ui/DialogController';
import { RoomController } from './RoomController';
import { InspectLayerController } from './InspectLayerController';

const { ccclass, property } = _decorator;

type ShapeType = 'circle' | 'triangle' | 'square' | 'diamond';

@ccclass('JiguanPuzzleController')
export class JiguanPuzzleController extends Component {
  @property(RoomController)
  public room: RoomController | null = null;

  @property(InspectLayerController)
  public inspect: InspectLayerController | null = null;

  @property({ type: SpriteFrame })
  public puzzleSprite: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  public solvedSprite: SpriteFrame | null = null;

  @property
  public puzzleDescription = '机关盒上有圆形、三角形、方形、菱形四个图案。';

  @property
  public solvedDescription = '机关盒发出轻响，似乎解锁了新的线索。';

  /** 解谜成功后播放的对话（占位，可在编辑器中修改） */
  @property([DialogLineInput])
  public solvedDialogLines: DialogLineInput[] = [];

  /** 首次打开机关盒时播放的对话（占位，可在编辑器中修改） */
  @property([DialogLineInput])
  public firstOpenDialogLines: DialogLineInput[] = [];

  @property(Node)
  public puzzleButtonsRoot: Node | null = null;

  @property(Node)
  public solvedOverlayRoot: Node | null = null;

  @property(Label)
  public circleCountLabel: Label | null = null;

  @property(Label)
  public triangleCountLabel: Label | null = null;

  @property(Label)
  public squareCountLabel: Label | null = null;

  @property(Label)
  public diamondCountLabel: Label | null = null;

  @property
  public targetCircle = 1;

  @property
  public targetTriangle = 3;

  @property
  public targetSquare = 4;

  @property
  public targetDiamond = 4;

  private circleCount = 0;
  private triangleCount = 0;
  private squareCount = 0;
  private diamondCount = 0;
  private solved = false;
  private firstOpened = false;

  start() {
    this.tryAutoBindRefs();
    this.resetCounts();
    this.resetVisualState();
  }

  /** 墙面热点点击后调用 */
  public async openFromWallRight() {
    this.tryAutoBindRefs();
    this.resetCounts();

    let openedByRoom = false;
    if (this.room) {
      this.room.openInspect(this.puzzleSprite ?? undefined, this.puzzleDescription);
      openedByRoom = !!this.room.inspect;
    }

    if (!openedByRoom) {
      const inspect = this.resolveInspect();
      if (!inspect) {
        console.warn('[JiguanPuzzleController] RoomController/InspectLayerController not assigned.');
        return;
      }
      inspect.show(this.puzzleSprite ?? undefined, this.puzzleDescription);
    }

    this.resetVisualState();

    // 首次打开时播放描述对话（先看图片再出对话）
    if (!this.firstOpened && this.firstOpenDialogLines.length > 0 && this.room) {
      this.firstOpened = true;
      // 等待用户关闭 InspectLayer 后再播放对话
      this.waitForInspectClosed().then(() => {
        this.room?.playDialogAsync(this.firstOpenDialogLines);
      });
    }
  }

  public onClickCircle() {
    this.pressShape('circle');
  }

  public onClickTriangle() {
    this.pressShape('triangle');
  }

  public onClickSquare() {
    this.pressShape('square');
  }

  public onClickDiamond() {
    this.pressShape('diamond');
  }

  /** 可选：在场景里挂一个重置按钮 */
  public onClickReset() {
    this.resetCounts();

    const inspect = this.resolveInspect();
    inspect?.show(this.puzzleSprite ?? undefined, this.puzzleDescription);

    this.resetVisualState();
  }

  private pressShape(shape: ShapeType) {
    if (this.solved) return;

    switch (shape) {
      case 'circle':
        this.circleCount += 1;
        break;
      case 'triangle':
        this.triangleCount += 1;
        break;
      case 'square':
        this.squareCount += 1;
        break;
      case 'diamond':
        this.diamondCount += 1;
        break;
    }

    this.refreshCountLabels();

    // 显示按下反馈
    const nameMap: Record<ShapeType, string> = {
      circle: '圆形',
      triangle: '三角形',
      square: '方形',
      diamond: '菱形',
    };
    const count = shape === 'circle' ? this.circleCount
      : shape === 'triangle' ? this.triangleCount
      : shape === 'square' ? this.squareCount
      : this.diamondCount;

    const inspect = this.resolveInspect();
    inspect?.show(this.puzzleSprite ?? undefined, `你按下了${nameMap[shape]}（第${count}次）`);

    if (this.isSolved()) {
      this.onSolved();
    }
  }

  private isSolved(): boolean {
    return (
      this.circleCount === this.targetCircle &&
      this.triangleCount === this.targetTriangle &&
      this.squareCount === this.targetSquare &&
      this.diamondCount === this.targetDiamond
    );
  }

  private async onSolved() {
    this.solved = true;

    if (this.puzzleButtonsRoot) {
      this.puzzleButtonsRoot.active = false;
    }
    if (this.solvedOverlayRoot) {
      this.solvedOverlayRoot.active = true;
    }

    const inspect = this.resolveInspect();
    inspect?.show(this.solvedSprite ?? undefined, this.solvedDescription);

    // 解谜成功后播放对话（先看图片再出对话）
    if (this.solvedDialogLines.length > 0 && this.room) {
      this.waitForInspectClosed().then(() => {
        this.room?.playDialogAsync(this.solvedDialogLines);
      });
    }
  }

  private resetCounts() {
    this.circleCount = 0;
    this.triangleCount = 0;
    this.squareCount = 0;
    this.diamondCount = 0;
    this.solved = false;
    this.refreshCountLabels();
  }

  private resetVisualState() {
    if (this.puzzleButtonsRoot) {
      this.puzzleButtonsRoot.active = true;
    }
    if (this.solvedOverlayRoot) this.solvedOverlayRoot.active = false;
  }

  private refreshCountLabels() {
    if (this.circleCountLabel) this.circleCountLabel.string = `${this.circleCount}`;
    if (this.triangleCountLabel) this.triangleCountLabel.string = `${this.triangleCount}`;
    if (this.squareCountLabel) this.squareCountLabel.string = `${this.squareCount}`;
    if (this.diamondCountLabel) this.diamondCountLabel.string = `${this.diamondCount}`;
  }

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

  /** 等待 InspectLayer 被用户关闭（点击遮罩或关闭按钮） */
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
