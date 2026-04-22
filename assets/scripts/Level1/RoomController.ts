import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export type WallId = 'left' | 'right' | 'floor' | 'front';

@ccclass('RoomController')
export class RoomController extends Component {
  @property(Node) overview: Node | null = null;

  @property(Node) wallLeft: Node | null = null;
  @property(Node) wallRight: Node | null = null;
  @property(Node) wallFloor: Node | null = null;
  @property(Node) wallFront: Node | null = null;

  start() {
    this.showOverview();
  }

  showOverview() {
    if (this.overview) this.overview.active = true;
    if (this.wallLeft) this.wallLeft.active = false;
    if (this.wallRight) this.wallRight.active = false;
    if (this.wallFloor) this.wallFloor.active = false;
    if (this.wallFront) this.wallFront.active = false;
  }

  showWall(id: WallId) {
    if (this.overview) this.overview.active = false;
    if (this.wallLeft) this.wallLeft.active = id === 'left';
    if (this.wallRight) this.wallRight.active = id === 'right';
    if (this.wallFloor) this.wallFloor.active = id === 'floor';
    if (this.wallFront) this.wallFront.active = id === 'front';
  }
}