import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CircleButton')
export class CircleButton extends Component {
  private handler: (() => void) | null = null;

  public setOnPressed(fn: () => void) {
    this.handler = fn;
  }

  // 在 Button 的 Click Events 里绑定这个方法
  public onClick() {
    this.handler?.();
  }
}