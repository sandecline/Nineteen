import { _decorator, Component, Node, SpriteFrame, find } from 'cc';
import { BackButtonController } from '../ui/BackButtonController';
import { DialogController, DialogLineInput } from '../ui/DialogController';
import { InspectLayerController } from './InspectLayerController';

const { ccclass, property } = _decorator;

export type WallId = 'left' | 'right' | 'floor' | 'front';

@ccclass('RoomController')
export class RoomController extends Component {
  // ===== Scene refs =====
  @property(Node)
  public roomOverview: Node | null = null;

  @property(Node)
  public wallLeft: Node | null = null;

  @property(Node)
  public wallRight: Node | null = null;

  @property(Node)
  public wallFloor: Node | null = null;

  @property(Node)
  public wallFront: Node | null = null;

  // ===== Global UI refs =====
  @property(BackButtonController)
  public back: BackButtonController | null = null;

  @property(InspectLayerController)
  public inspect: InspectLayerController | null = null;

  @property(DialogController)
  public dialog: DialogController | null = null;

  @property(Node)
  public interactionRoot: Node | null = null;

  // ===== State =====
  private currentWall: WallId | null = null;
  private inspectOpen = false;

  start() {
    this.tryAutoBindInspect();
    this.tryAutoBindDialog();

    // Keep back-stack consistent even if InspectLayer is closed by mask/close button
    if (this.inspect) {
      this.inspect.onClosed = () => this.onInspectClosedExternally();
    }
    this.showOverview();
  }

  private tryAutoBindDialog() {
    if (this.dialog) return;

    const dialogNode =
      find('Canvas/DialogLayer') ??
      find('DialogLayer');

    this.dialog = dialogNode?.getComponent(DialogController) ?? null;
    if (!this.dialog) {
      console.warn('[RoomController] DialogController not assigned and auto-bind failed.');
    }
  }

  private tryAutoBindInspect() {
    if (this.inspect) return;

    const inspectNode =
      find('Canvas/Level1Root/InspectLayer') ??
      find('Canvas/InspectLayer') ??
      find('InspectLayer');

    this.inspect = inspectNode?.getComponent(InspectLayerController) ?? null;
    if (!this.inspect) {
      console.warn('[RoomController] InspectLayerController not assigned and auto-bind failed.');
    }
  }

  // ===== Navigation: Overview <-> Walls =====
  public showOverview() {
    this.currentWall = null;

    if (this.roomOverview) this.roomOverview.active = true;

    if (this.wallLeft) this.wallLeft.active = false;
    if (this.wallRight) this.wallRight.active = false;
    if (this.wallFloor) this.wallFloor.active = false;
    if (this.wallFront) this.wallFront.active = false;

    this.closeInspectInstant();

    // Overview is root, no "back" needed
    this.back?.clear();
  }

  public showLeft() {
    this.showWall('left');
  }
  public showRight() {
    this.showWall('right');
  }
  public showFloor() {
    this.showWall('floor');
  }
  public showFront() {
    this.showWall('front');
  }

  public showWall(id: WallId) {
    this.currentWall = id;

    if (this.roomOverview) this.roomOverview.active = false;

    if (this.wallLeft) this.wallLeft.active = id === 'left';
    if (this.wallRight) this.wallRight.active = id === 'right';
    if (this.wallFloor) this.wallFloor.active = id === 'floor';
    if (this.wallFront) this.wallFront.active = id === 'front';

    this.closeInspectInstant();

    // Entering a wall detail resets stack to a single action: back to overview
    this.back?.clear();
    this.back?.push(() => this.showOverview());
  }

  // ===== Inspect Layer (2nd-level sub-scene) =====
  /** Open inspect layer with image and optional text. */
  public openInspect(spriteFrame?: SpriteFrame, description?: string) {
    if (!this.inspect) return;

    if (this.inspectOpen) {
      this.inspect.show(spriteFrame, description);
      return;
    }

    this.inspectOpen = true;
    this.inspect.show(spriteFrame, description);

    // Push one more "back" layer: close inspect
    if (this.back) {
      this.back.push(() => {
        // Use inspect.hide() so that onClosed triggers and stack stays consistent
        this.inspect?.hide();
      });
    }
  }

  /** Convenience method for Button ClickEvents: open inspect with no args (placeholder). */
  public openInspectEmpty() {
    this.openInspect(undefined, '');
  }

  private closeInspectInstant() {
    this.inspectOpen = false;
    this.inspect?.hideInstant();
  }

  /**
   * If user closes inspect by clicking mask/close button,
   * the back stack still contains one action that would try to close it again.
   * We rebuild the stack so "back" returns to overview (from any wall).
   */
  public onInspectClosedExternally() {
    // Guard against double-calls
    if (!this.inspectOpen) return;

    this.inspectOpen = false;

    // Rebuild stack to base level for current wall
    this.back?.clear();
    if (this.currentWall) {
      this.back?.push(() => this.showOverview());
    }
  }

  // ===== Dialog integration =====

  /**
   * 播放对话，期间自动禁用 interactionRoot 防止交互冲突。
   * 对话结束后自动恢复 interactionRoot。
   */
  public playDialogAsync(lines: DialogLineInput[]): Promise<void> {
    return new Promise((resolve) => {
      if (!this.dialog) return resolve();

      // 屏蔽交互
      if (this.interactionRoot) this.interactionRoot.active = false;

      this.dialog.play({
        lines,
        onFinished: () => {
          // 恢复交互
          if (this.interactionRoot) this.interactionRoot.active = true;
          resolve();
        },
      });
    });
  }

  /** 判断当前是否有对话在播放 */
  public isDialogPlaying(): boolean {
    return this.dialog?.isPlaying() ?? false;
  }
}