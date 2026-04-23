import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

type BackAction = () => void;

@ccclass('BackButtonController')
export class BackButtonController extends Component {
  @property(Node)
  public buttonNode: Node | null = null; // 可填 BackButton，不填就用 BackLayer 自己

  private stack: BackAction[] = [];

  onLoad() {
    this.refresh();
  }

  public get depth() {
    return this.stack.length;
  }

  public push(action: BackAction) {
    this.stack.push(action);
    this.refresh();
  }

  public pop() {
    const action = this.stack.pop();
    this.refresh();
    action?.();
  }

  public clear() {
    this.stack.length = 0;
    this.refresh();
  }

  /** Button ClickEvents 绑这个 */
  public onClickBack() {
    this.pop();
  }

  private refresh() {
    const visible = this.stack.length > 0;
    const target = this.buttonNode ?? this.node;
    if (target) target.active = visible;
  }
}