import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 柜子控制器 - 独立热点控制抽屉显示
 * 每个热点按钮控制对应的抽屉显示/隐藏
 * 独占模式：显示抽屉后必须再次点击同一热点才能返回
 */
@ccclass('CabinetController')
export class CabinetController extends Component {
  /** 抽屉节点列表 */
  @property({ type: [Node] })
  public drawers: Node[] = [];

  /** 热点按钮节点列表 */
  @property({ type: [Node], tooltip: '三个热点按钮，用于控制显示/隐藏' })
  public hotspotButtons: Node[] = [];

  /** 当前显示的抽屉索引 */
  private currentIndex = -1;

  /** 是否处于查看模式（显示抽屉后） */
  private isViewing = false;

  start() {
    // 初始化：全部隐藏
    this.drawers.forEach(d => {
      if (d) d.active = false;
    });
    // 初始化热点按钮激活状态
    this.hotspotButtons.forEach(btn => {
      if (btn) btn.active = true;
    });
  }

  /** 点击显示guizi1 */
  public onClickGuizi1() {
    this.handleHotspotClick(0);
  }

  /** 点击显示guizi2 */
  public onClickGuizi2() {
    this.handleHotspotClick(1);
  }

  /** 点击显示guizi3 */
  public onClickGuizi3() {
    this.handleHotspotClick(2);
  }

  /** 处理热点按钮点击 - 独占模式 */
  private handleHotspotClick(index: number) {
    // 如果正在查看抽屉
    if (this.isViewing) {
      // 必须是点击同一个热点才能关闭
      if (this.currentIndex === index) {
        this.hideDrawer();
      }
      // 点击其他热点无效
      return;
    }

    // 如果没有查看抽屉，则显示对应的抽屉
    this.showDrawer(index);
  }

  /** 显示指定索引的抽屉 */
  private showDrawer(index: number) {
    this.currentIndex = index;
    this.isViewing = true;
    
    const target = this.drawers[index];
    if (target) target.active = true;
    
    console.log(`显示抽屉 ${index + 1}，进入查看模式`);
  }

  /** 隐藏当前抽屉，退出查看模式 */
  private hideDrawer() {
    if (this.currentIndex >= 0 && this.currentIndex < this.drawers.length) {
      const current = this.drawers[this.currentIndex];
      if (current) current.active = false;
    }
    
    console.log(`关闭抽屉 ${this.currentIndex + 1}，退出查看模式`);
    
    this.currentIndex = -1;
    this.isViewing = false;
  }

  /** 重置到初始状态 */
  public reset() {
    this.hideDrawer();
  }
}
