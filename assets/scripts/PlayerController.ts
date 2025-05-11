import type { EventMouse } from 'cc'
import { _decorator, Animation, Component, Input, Node, Vec3 } from 'cc'

const { ccclass, property } = _decorator

export const BLOCK_SIZE = 40 // 添加一个放大比
const LONG_PRESS_DURATION = 0.3 // 长按判定时长，单位：秒

@ccclass('PlayerController')
export class PlayerController extends Component {
  @property(Animation)
  BodyAnim: Animation = null

  @property(Node)
  touchNode: Node = null

  private _startJump: boolean = false
  private _jumpStep: number = 0
  private _curJumpTime: number = 0
  private _jumpTime: number = 0.1
  private _curJumpSpeed: number = 0
  private _curPos: Vec3 = new Vec3()
  private _deltaPos: Vec3 = new Vec3(0, 0, 0)
  private _targetPos: Vec3 = new Vec3()
  private _curMoveIndex: number = 0
  private _longPressTimer: any = null
  private _isLongPress: boolean = false

  start() {
    // input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this)
  }

  setInputActive(active: boolean) {
    if (active) {
      this.touchNode.on(Input.EventType.TOUCH_START, this.onTouchStart, this)
      this.touchNode.on(Input.EventType.TOUCH_END, this.onTouchEnd, this)
      this.touchNode.on(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this)
    } else {
      this.touchNode.off(Input.EventType.TOUCH_START, this.onTouchStart, this)
      this.touchNode.off(Input.EventType.TOUCH_END, this.onTouchEnd, this)
      this.touchNode.off(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this)
    }
  }

  reset() {
    this._curMoveIndex = 0
    this.node.getPosition(this._curPos)
    this._targetPos.set(0, 0, 0)
    this._isLongPress = false
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer)
      this._longPressTimer = null
    }
  }

  onMouseUp(event: EventMouse) {
    if (event.getButton() === 0) {
      this.jumpByStep(1)
    } else if (event.getButton() === 2) {
      this.jumpByStep(2)
    }
  }

  onTouchStart() {
    this._isLongPress = false
    // 清除上一次可能存在的计时器
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer)
    }
    this._longPressTimer = setTimeout(() => {
      this._isLongPress = true
      // 长按触发跳两步
      console.log('Long Press')
      this.jumpByStep(2)
    }, LONG_PRESS_DURATION * 1000)
  }

  onTouchEnd() {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer)
      this._longPressTimer = null
    }
    // 如果不是长按，则认为是轻点
    if (!this._isLongPress) {
      // 轻点触发跳一步
      console.log('Tap')
      this.jumpByStep(1)
    }
    // 重置长按标记，以便下次触摸
    this._isLongPress = false
  }

  onTouchCancel() {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer)
      this._longPressTimer = null
    }
    this._isLongPress = false
    console.log('Touch Cancel')
  }

  jumpByStep(step: number) {
    if (this._startJump) {
      return
    }
    this._startJump = true
    this._jumpStep = step
    this._curJumpTime = 0

    const clipName = step === 1 ? 'oneStep' : 'twoStep'
    const state = this.BodyAnim.getState(clipName)
    this._jumpTime = state.duration

    this._curJumpSpeed = this._jumpStep * BLOCK_SIZE / this._jumpTime
    this.node.getPosition(this._curPos)
    Vec3.add(this._targetPos, this._curPos, new Vec3(this._jumpStep * BLOCK_SIZE, 0, 0))

    if (this.BodyAnim) {
      if (step === 1) {
        this.BodyAnim.play('oneStep')
      } else if (step === 2) {
        this.BodyAnim.play('twoStep')
      }
    }

    this._curMoveIndex += step
  }

  onOnceJumpEnd() {
    this.node.emit('JumpEnd', this._curMoveIndex)
  }

  update(deltaTime: number) {
    if (this._startJump) {
      this._curJumpTime += deltaTime
      if (this._curJumpTime > this._jumpTime) {
        // end
        this.node.setPosition(this._targetPos)
        this._startJump = false
        this.onOnceJumpEnd()
      } else {
        // tween
        this.node.getPosition(this._curPos)
        this._deltaPos.x = this._curJumpSpeed * deltaTime
        Vec3.add(this._curPos, this._curPos, this._deltaPos)
        this.node.setPosition(this._curPos)
      }
    }
  }
}
