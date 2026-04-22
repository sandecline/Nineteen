import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Hotspot')
export class Hotspot extends Component {
  @property
  id = ''; // 例：left / right / item_note / item_key

  onClick() {
    // 先留空，后面由具体墙面脚本/Room脚本去拿节点并注册也行
    // 或者你直接在 Button ClickEvents 里绑到具体 Controller 的方法（更简单）
  }
}