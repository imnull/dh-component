import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ListItem from './item';
class List extends React.Component {
  static Item = ListItem;
  static propsTypes = {
    defaultKeys: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]), // 默认选中的项
    selectedKeys: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]), //选中的项
    mode: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.oneOf(['only', 'multiple']), // LIST模式
    ]),
    immutable: PropTypes.bool, // only模式下的可变性
    animation: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string,
    icon: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.string,
    ]), // 子元素的后缀图标， 如果设置false 则不显示
  }
  static childContextTypes = {
    animation: PropTypes.bool,
    forbid: PropTypes.bool, // 禁用子元素的点击
  }
  static defaultProps = {
    mode: false,
    multiple: false,
    immutable: false,
    animation: true,
    icon: false,
  }
  constructor(props) {
    super(props);
    this.state = {
      selectedKeys: [],
      children: this.props.children
    };
    this.handleChange = this.handleChange.bind(this);

    // 初始化DOM底层
    this.domInitAll();
  }
  componentDidMount() {
     let selectedKeys = [];
    if (this.props.defaultKeys) {
      const defaultKeys = this.props.defaultKeys;
      if (typeof defaultKeys === 'string') {
        selectedKeys = [defaultKeys];
        console.error('Error:', 'defaultKeys is defined as Array, you pass in a string!!!');
      }  else if (Array.isArray(defaultKeys)) {
        selectedKeys = defaultKeys;
      }
    } else if (this.props.selectedKeys ) {
      if (Array.isArray(this.props.selectedKeys)) {
        selectedKeys = this.props.selectedKeys
      } else {
        throw new Error('selectedKeys is data type error');
      }
    }
     this.setState({ selectedKeys });
  }
  componentWillReceiveProps(nextProps) {
    let selectedKeys = [];
    if (JSON.stringify(nextProps.defaultKeys) !== JSON.stringify(this.props.defaultKeys)) {
      if (nextProps.defaultKeys) {
        const defaultKeys = this.props.defaultKeys;
        let selectedKeys = [];
        if (typeof defaultKeys === 'string') {
          selectedKeys = [defaultKeys];
          console.error('Error:', 'defaultKeys is defined as Array, you pass in a string!!!');
        }  else if (Array.isArray(defaultKeys)) {
          selectedKeys = defaultKeys;
        }
      }
    }
    if (JSON.stringify(nextProps.selectedKeys) !== JSON.stringify(this.props.defaultKeys)) {
      let selectedKeys = [];
      if (Array.isArray(selectedKeys)) {
        selectedKeys = selectedKeys;
      } else {
        throw new Error('selectedKeys is data type error');
      }
    }
  }
  getChildContext() {
    const forbid = ['only', 'multiple'].indexOf(this.props.mode) !== -1 ? true : false;
    return {
      animation: this.props.animation,
      forbid
    };
  }
  handleChange(key, selected) {
    const { multiple, mode, immutable } = this.props;
    const { selectedKeys } = this.state;
    let selectedRowKeys = [];
    if (typeof mode === 'string' && mode === 'only')  {
      selectedRowKeys = selected ? [key] : [];
      // // immutable -- only 模式下的可变性
      // if (typeof immutable === 'boolean' && immutable) {
      //   selectedRowKeys = [key];
      // } else {
      //   console.log('wjb-s', selected);

      // }
    } else if (typeof mode === 'string' && mode === 'multiple') {
      selectedRowKeys = selected ? Array.from(new Set([...selectedKeys, key]))
        : selectedKeys.filter(srk => srk !== key);
    }
    this.setState({ selectedKeys: selectedRowKeys}, () => {
      if (this.props.onChange) {
        this.props.onChange(selectedRowKeys);
      }
    });
  }


  /*
   * DOM handle
   * !!!底层事件尚未做移动端兼容!!!
   * by Marvin 2017-06-20 17:30
   */
  
  // 初始化所有dom相关
  domInitAll(){

    this.state.domDraggable = !!this.props.domDraggable;
    this.state.dragDelay = 500;
    if(typeof(this.props.dragDelay) == 'number' && props.dragDelay > 0){
      this.state.dragDelay = this.props.dragDelay;
    }
    this.handleMouseDown = this.handleMouseDown.bind(this);

    this.domInitWaitLogo();
    this.domXTimerInit();
    this.domInitDragEvents();
  }
  // 初始化XTimer
  domXTimerInit(){

    this.state.timerDur = 500;
    if(typeof(this.props.timerDur) == 'number' && this.props.timerDur > 0){
      this.state.timerDur = this.props.timerDur;
    }

    this.state.waitLogoTimer = new XTimer(this.state.timerDur);
    this.state.waitLogoTimer.onend = function(){
      List.domDrawArc(this.state.waitLogo.getContext('2d'), 0);
      this.state.waitLogo.style.display = 'none';
      this.domStartDrag();
    }.bind(this);

    this.state.waitLogoTimer.onabort = function(){
      List.domDrawArc(this.state.waitLogo.getContext('2d'), 0);
      this.state.waitLogo.style.display = 'none';
    }.bind(this);

  }
  // 初始化等待图标
  domInitWaitLogo(){
    let waitLogo = document.createElement('canvas');
    waitLogo.width = 50;
    waitLogo.height = 50;
    var ctx = waitLogo.getContext('2d');

    waitLogo.style.cssText = 'cursor:pointer;user-select:none;display:none;background-color:transparent;position:absolute;left:0px;top:0px;margin-left:-25px;margin-top:-25px;z-index:99999';

    this.state.waitLogo = waitLogo;
    document.body.appendChild(this.state.waitLogo);
  }

  domSetWaitLogoPosition(e){
    this.state.waitLogo.style.left = e.clientX + 'px';
    this.state.waitLogo.style.top = e.clientY + 'px';
  }

  domInitDragEvents(){
    // 定义鼠标拖动触发前的鼠标移动事件
    if(!this.state.domBeforeMouseMove){
      this.state.domBeforeMouseMove = function beforeMouseMove(e){
        if(this.state.waitLogo.style.display != 'none'){
          this.domSetWaitLogoPosition(e);
        }
        this.state.waitLogoTimer.abort();
        if(this.state.delayHandle){
          clearTimeout(this.state.delayHandle);
          delete this.state.delayHandle;
        }
      }.bind(this);
      document.addEventListener('mousemove', this.state.domBeforeMouseMove);
    }

    // 定义全局鼠标移动事件函数
    if(!this.state.domCloneDomMouseMove){
      this.state.domCloneDomMouseMove = function mousemove(e){
        
        this.state.waitLogo.style.left = e.clientX + 'px';
        this.state.waitLogo.style.top = e.clientY + 'px';

        let currentPosition = [e.clientX, e.clientY];
        currentPosition[0] -= this.state.domStartMousePosition[0];
        currentPosition[1] -= this.state.domStartMousePosition[1];

        let left = this.state.domStartRect.left + currentPosition[0];
        let top = this.state.domStartRect.top + currentPosition[1];

        this.state.domCloneItem.style.left = left + 'px';
        this.state.domCloneItem.style.top = top + 'px';


        let tops = this.state.domChildrenTop.slice(0);
        tops[this.state.domDragIndex] = top;

        let domChildren = this.state.domChildren;

        tops = tops.map(function(v,i){
          return [v, this.state.children[i], domChildren[i], i]
        }.bind(this));

        tops.sort((a, b) => a[0] - b[0]);
        let children = tops.map((v) => v[1]);
        let childrenDom = tops.map((v) => v[2]);
        let serial = children.map((child) => child.key).join(',');

        if(serial != this.state.domChildSerial){
          this.state.domChildSerial = serial;
          this.state.__children = children;
          let parent = this.state.domListContainer;
          childrenDom.forEach((c) => {
            parent.appendChild(c);
          })
        }
        
      }.bind(this)
    }

    // 定义全局鼠标抬起事件函数
    if(!this.state.domMouseUp){
      this.state.domMouseUp = function mouseup(e){

        // 强制清理延迟对象
        clearTimeout(this.state.delayHandle);

        // this.state.waitLogo.style.display = 'none';
        this.state.waitLogoTimer.abort();
        // 移除相关事件
        document.removeEventListener('mousemove', this.state.domCloneDomMouseMove);
        // document.removeEventListener('mouseup', mouseup);

        this.state.domListContainer.style.cssText = '';
        this.state.domDragTarget.style.cssText = '';
        if(this.state.domCloneItem && this.state.domCloneItem.parentNode) {
          this.state.domCloneItem.parentNode.removeChild(this.state.domCloneItem);
        }

        this.state.__children && this.setState({
          children: this.state.__children
        });
        delete this.state.__children;

      }.bind(this)
    }

    // 全局节点添加鼠标按键抬起事件
    document.addEventListener('mouseup', this.state.domMouseUp);
  }

  // 等待图标动画
  domDrawWaitLogoAnimation(){
    let ctx = this.state.waitLogo.getContext('2d');
    let r = Math.min(ctx.canvas.width, ctx.canvas.height) / 2;

    this.state.waitLogoTimer.run(function(rate){
      List.domDrawArc(ctx, rate);
    }.bind(this));
  }

  // 等待图标绘制
  static domDrawArc(ctx, arcRate){
    let r = Math.min(ctx.canvas.width, ctx.canvas.height) / 2;
    ctx.clearRect(0, 0, r * 2, r * 2);
    if(!arcRate) return;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,255,0.3)';
    ctx.strokeStyle = 'rgba(0,0,255,0.3)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(r, r, r - ctx.lineWidth, 0, Math.PI * 2 * arcRate);
    // ctx.lineTo(r, r);
    // ctx.fill();
    ctx.stroke();
  }

  // 设置拖动克隆目标样式
  static domSetCloneItemStyle(dom, rect){
    // 设置克隆节点样式
    if(!dom) return;
    dom.style.opacity = 0.5;
    dom.style.position = 'absolute';
    dom.style.marginLeft = '-1px';
    dom.style.zIndex = 9999;
    dom.style.left = rect.left + 'px';
    dom.style.top = rect.top + 'px';
    dom.style.width = rect.width + 'px';
    dom.style.border = "1px dashed #f00";
  }

  // 设置拖动原始目标样式
  static domSetTargetItemStyle(dom){
    if(!dom) return;
    dom.style.opacity = 0.2;
  }

  // 开始拖动
  domStartDrag(){
    // 克隆当前节点Item
    var cloneItem = this.state.domDragTarget.cloneNode(true);
    // 设置克隆节点样式
    List.domSetCloneItemStyle(cloneItem, this.state.domStartRect);
    List.domSetTargetItemStyle(this.state.domDragTarget);

    // 克隆节点存入对象全局
    this.state.domCloneItem = cloneItem;

    // 全页面添加鼠标移动事件，防止拖拽节点丢失
    document.addEventListener('mousemove', this.state.domCloneDomMouseMove);

    this.state.domDragTarget.parentNode.appendChild(cloneItem);
  }

  // 获取选项DOM
  domGetChildren(dom){
    let arr = [];
    let child = dom.firstChild;
    while(child){
      arr.push(child);
      child = child.nextSibling;
    }
    return arr;
  }

  // 节点按下事件，取用React方法
  handleMouseDown(e){

    if(!this.state.domDraggable) return;

    var tar = e.target;
    while(tar && tar.nodeName != 'LI'){
      tar = tar.parentNode;
    }
    if(!tar) return;

    // 禁用父节点文本选择
    tar.parentNode.style.userSelect = 'none';

    // 获取基本位置信息
    // 直接赋值不触发React更新
    this.state.domStartMousePosition = [e.clientX, e.clientY];
    this.state.domStartRect = List.domGetTargetRect(tar);
    this.state.domDragTarget = tar;
    this.state.domListContainer = tar.parentNode;
    this.state.domChildren = this.domGetChildren(tar.parentNode);
    this.state.domDragIndex = this.state.domChildren.indexOf(tar);
    this.state.domChildrenTop = this.state.domChildren.map((child) => child.offsetTop);
    this.state.domChildSerial = this.state.children.map((child) => child.key).join(',');

    // 定位等待图标
    this.domSetWaitLogoPosition(e);

    // 延迟脚本
    this.state.delayHandle = setTimeout(function(){
      // 显示等待图标
      this.state.waitLogo.style.display = 'block';
      this.domDrawWaitLogoAnimation();
    }.bind(this), this.state.dragDelay);
  }

  static domGetOffsetPosition(tar){
    let pos = [0, 0];
    let el = tar.parentNode;
    while(el && el.nodeName != 'BODY'){
      pos[0] += el.offsetLeft;
      pos[1] += el.offsetTop;
      el = el.offsetParent;
    }
    return pos;
  }

  static domGetTargetRect(tar){
    let rect = {
      width: tar.offsetWidth, height: tar.offsetHeight, left: tar.offsetLeft, top: tar.offsetTop
    };
    // let offset = this.domGetOffsetPosition(tar);
    // rect.left -= offset[0];
    // rect.top -= offset[1];
    return rect;
  }

  render() {
    const { bordered, shadow, className, style } = this.props;
    const children = this.state.children;
    const selectedKeys = this.props.selectedKeys ? this.props.selectedKeys : this.state.selectedKeys;
    return (
      <ul ref="container"
        style={style}
        className={
          classNames('dh-list', {
            'dh-list-borderd': bordered,
            [className]: className
          })
        }
        onMouseDown={this.handleMouseDown}
      >
        {
          React.Children.map(children,
           (child, idx) => {
              const props = {
                ...child.props,
                onChange: this.handleChange,
                eventKey: child.key,
                selectedKeys
              };
            return {...child, props};
          })
        }
      </ul>
    )
  }
}

function XTimer(dur, interval){
  this.dur = dur || 1000;
  this.interval = interval || 10;
}
XTimer.prototype = {
  run: function(cb){
    this.startTime = Date.now();
    this.handle = setInterval(function(){
      let interval = Math.max(Date.now() - this.startTime, 0);
      interval = Math.min(this.dur, interval);
      if(interval >= this.dur){
        cb(1);
        if(typeof(this.onend) == 'function'){
          this.onend();
        }
        clearInterval(this.handle);
      } else {
        cb(interval / this.dur);
      }
    }.bind(this), this.interval);
  },
  abort: function(){
    clearInterval(this.handle);
    if(typeof(this.onabort) == 'function'){
      this.onabort();
    }
  }
};

export default List;
