'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.isEvent = isEvent;
exports.objectsCollide = objectsCollide;
exports.getBoundsForNode = getBoundsForNode;

var _contains = require('dom-helpers/query/contains');

var _contains2 = _interopRequireDefault(_contains);

var _closest = require('dom-helpers/query/closest');

var _closest2 = _interopRequireDefault(_closest);

var _events = require('dom-helpers/events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function addEventListener(type, handler) {
  _events2.default.on(document, type, handler);
  return {
    remove: function remove() {
      _events2.default.off(document, type, handler);
    }
  };
}

function isOverContainer(container, x, y) {
  return !container || (0, _contains2.default)(container, document.elementFromPoint(x, y));
}

function isEvent(node, _ref) {
  var clientX = _ref.clientX,
      clientY = _ref.clientY;

  var target = document.elementFromPoint(clientX, clientY);
  return !!(0, _closest2.default)(target, '.rbc-event', node);
}

var clickTolerance = 5;

var Selection = function () {
  function Selection(node) {
    var global = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    _classCallCheck(this, Selection);

    this.container = node;
    this.globalMouse = !node || global;

    this._listeners = Object.create(null);

    // events for mouse
    this._mouseDown = this._mouseDown.bind(this);
    this._mouseUp = this._mouseUp.bind(this);
    this._openSelector = this._openSelector.bind(this);
    this._keyListener = this._keyListener.bind(this);

    // events for touch
    this._touchStart = this._touchStart.bind(this);
    this._touchEnd = this._touchEnd.bind(this);
    this._openSelectorTouch = this._openSelectorTouch.bind(this);

    // listeners for mouse
    this._onMouseDownListener = addEventListener('mousedown', this._mouseDown);
    this._onKeyDownListener = addEventListener('keydown', this._keyListener);
    this._onKeyUpListener = addEventListener('keyup', this._keyListener);

    // listeners for touch
    this._onTouchStartListener = addEventListener('touchstart', this._touchStart);
    this._onTouchEndListener = addEventListener('touchend', this._touchEnd);
  }

  Selection.prototype.on = function on(type, handler) {
    var handlers = this._listeners[type] || (this._listeners[type] = []);

    handlers.push(handler);

    return {
      remove: function remove() {
        var idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
      }
    };
  };

  Selection.prototype.emit = function emit(type) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var result = void 0;
    var handlers = this._listeners[type] || [];
    handlers.forEach(function (fn) {
      if (result === undefined) result = fn.apply(undefined, args);
    });
    return result;
  };

  Selection.prototype.teardown = function teardown() {
    this.listeners = Object.create(null);
    this._onMouseDownListener && this._onMouseDownListener.remove();
    this._onMouseUpListener && this._onMouseUpListener.remove();
    this._onMouseMoveListener && this._onMouseMoveListener.remove();
    this._onKeyUpListener && this._onKeyUpListener.remove();
    this._onKeyDownListener && this._onKeyDownListener.remove();
    this._onTouchStartListener && this._onTouchStartListener.remove();
    this._onTouchEndListener && this._onTouchEndListener.remove();
  };

  Selection.prototype.isSelected = function isSelected(node) {
    var box = this._selectRect;

    if (!box || !this.selecting) return false;

    return objectsCollide(box, getBoundsForNode(node));
  };

  Selection.prototype.filter = function filter(items) {
    var box = this._selectRect;

    //not selecting
    if (!box || !this.selecting) return [];

    return items.filter(this.isSelected, this);
  };

  Selection.prototype._mouseDown = function _mouseDown(e) {
    var node = this.container(),
        collides,
        offsetData;

    // Right clicks
    if (e.which === 3 || e.button === 2 || !isOverContainer(node, e.clientX, e.clientY)) return;

    if (!this.globalMouse && node && !(0, _contains2.default)(node, e.target)) {
      var _normalizeDistance = normalizeDistance(0),
          top = _normalizeDistance.top,
          left = _normalizeDistance.left,
          bottom = _normalizeDistance.bottom,
          right = _normalizeDistance.right;

      offsetData = getBoundsForNode(node);

      collides = objectsCollide({
        top: offsetData.top - top,
        left: offsetData.left - left,
        bottom: offsetData.bottom + bottom,
        right: offsetData.right + right
      }, { top: e.pageY, left: e.pageX });

      if (!collides) return;
    }

    var result = this.emit('mousedown', this._mouseDownData = {
      x: e.pageX,
      y: e.pageY,
      clientX: e.clientX,
      clientY: e.clientY
    });

    if (result === false) return;

    //e.preventDefault();

    this._onMouseUpListener = addEventListener('mouseup', this._mouseUp);
    this._onMouseMoveListener = addEventListener('mousemove', this._openSelector);
  };

  Selection.prototype._touchStart = function _touchStart(e) {
    var pageX = e.changedTouches[0].screenX,
        pageY = e.changedTouches[0].screenY,
        clientX = e.changedTouches[0].clientX,
        clientY = e.changedTouches[0].clientY,
        node = this.container(),
        collides,
        offsetData;

    if (!this.globalMouse && node && !(0, _contains2.default)(node, e.target)) {
      var _normalizeDistance2 = normalizeDistance(0),
          top = _normalizeDistance2.top,
          left = _normalizeDistance2.left,
          bottom = _normalizeDistance2.bottom,
          right = _normalizeDistance2.right;

      offsetData = getBoundsForNode(node);

      collides = objectsCollide({
        top: offsetData.top - top,
        left: offsetData.left - left,
        bottom: offsetData.bottom + bottom,
        right: offsetData.right + right
      }, { top: e.pageY, left: e.pageX });

      if (!collides) return;
    }

    var result = this.emit('mousedown', this._mouseDownData = {
      x: pageX,
      y: pageY,
      clientX: clientX,
      clientY: clientY
    });

    if (result === false) return;

    //e.preventDefault();

    this._onTouchEndListener = addEventListener('touchend', this._touchEnd);
    this._onTouchMoveListener = addEventListener('touchmove', this._openSelectorTouch);
  };

  Selection.prototype._mouseUp = function _mouseUp(e) {
    this._onMouseUpListener && this._onMouseUpListener.remove();
    this._onMouseMoveListener && this._onMouseMoveListener.remove();

    if (!this._mouseDownData) return;

    var inRoot = !this.container || (0, _contains2.default)(this.container(), e.target);
    var bounds = this._selectRect;
    var click = this.isClick(e.pageX, e.pageY);

    this._mouseDownData = null;

    if (click && !inRoot) {
      return this.emit('reset');
    }

    if (click && inRoot) return this.emit('click', {
      x: e.pageX,
      y: e.pageY,
      clientX: e.clientX,
      clientY: e.clientY
    });

    // User drag-clicked in the Selectable area
    if (!click) return this.emit('select', bounds);

    this.selecting = false;
  };

  Selection.prototype._touchEnd = function _touchEnd(e) {
    this._onTouchMoveListener && this._onTouchMoveListener.remove();

    var pageX = e.changedTouches[0].screenX,
        pageY = e.changedTouches[0].screenY,
        clientX = e.changedTouches[0].clientX,
        clientY = e.changedTouches[0].clientY;

    if (!this._mouseDownData) return;

    var inRoot = !this.container || (0, _contains2.default)(this.container(), e.target);
    var bounds = this._selectRect;
    var click = this.isClick(e.pageX, e.pageY);

    this._mouseDownData = null;

    if (click && !inRoot) {
      return this.emit('reset');
    }

    if (click && inRoot) return this.emit('click', {
      x: pageX,
      y: pageY,
      clientX: clientX,
      clientY: clientY
    });

    // User drag-clicked in the Selectable area
    if (!click) return this.emit('select', bounds);

    this.selecting = false;
  };

  Selection.prototype._openSelector = function _openSelector(e) {
    var _mouseDownData = this._mouseDownData,
        x = _mouseDownData.x,
        y = _mouseDownData.y;

    var w = Math.abs(x - e.pageX);
    var h = Math.abs(y - e.pageY);

    var left = Math.min(e.pageX, x),
        top = Math.min(e.pageY, y),
        old = this.selecting;

    this.selecting = true;

    if (!old) {
      this.emit('selectStart', this._mouseDownData);
    }

    if (!this.isClick(e.pageX, e.pageY)) this.emit('selecting', this._selectRect = {
      top: top,
      left: left,
      x: e.pageX,
      y: e.pageY,
      right: left + w,
      bottom: top + h
    });
  };

  Selection.prototype._openSelectorTouch = function _openSelectorTouch(e) {
    var pageX = e.changedTouches[0].screenX,
        pageY = e.changedTouches[0].screenY;

    var _mouseDownData2 = this._mouseDownData,
        x = _mouseDownData2.x,
        y = _mouseDownData2.y;

    var w = Math.abs(x - e.pageX);
    var h = Math.abs(y - e.pageY);

    var left = Math.min(e.pageX, x),
        top = Math.min(e.pageY, y),
        old = this.selecting;

    this.selecting = true;

    if (!old) {
      this.emit('selectStart', this._mouseDownData);
    } else {
      e.preventDefault();
    }

    if (!this.isClick(pageX, pageY)) this.emit('selecting', this._selectRect = {
      top: top,
      left: left,
      x: pageX,
      y: pageY,
      right: left + w,
      bottom: top + h
    });
  };

  Selection.prototype._keyListener = function _keyListener(e) {
    this.ctrl = e.metaKey || e.ctrlKey;
  };

  Selection.prototype.isClick = function isClick(pageX, pageY) {
    var _mouseDownData3 = this._mouseDownData,
        x = _mouseDownData3.x,
        y = _mouseDownData3.y;

    return Math.abs(pageX - x) <= clickTolerance && Math.abs(pageY - y) <= clickTolerance;
  };

  return Selection;
}();

/**
 * Resolve the disance prop from either an Int or an Object
 * @return {Object}
 */


function normalizeDistance() {
  var distance = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

  if ((typeof distance === 'undefined' ? 'undefined' : _typeof(distance)) !== 'object') distance = { top: distance, left: distance, right: distance, bottom: distance };

  return distance;
}

/**
 * Given two objects containing "top", "left", "offsetWidth" and "offsetHeight"
 * properties, determine if they collide.
 * @param  {Object|HTMLElement} a
 * @param  {Object|HTMLElement} b
 * @return {bool}
 */
function objectsCollide(nodeA, nodeB) {
  var tolerance = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  var _getBoundsForNode = getBoundsForNode(nodeA),
      aTop = _getBoundsForNode.top,
      aLeft = _getBoundsForNode.left,
      _getBoundsForNode$rig = _getBoundsForNode.right,
      aRight = _getBoundsForNode$rig === undefined ? aLeft : _getBoundsForNode$rig,
      _getBoundsForNode$bot = _getBoundsForNode.bottom,
      aBottom = _getBoundsForNode$bot === undefined ? aTop : _getBoundsForNode$bot;

  var _getBoundsForNode2 = getBoundsForNode(nodeB),
      bTop = _getBoundsForNode2.top,
      bLeft = _getBoundsForNode2.left,
      _getBoundsForNode2$ri = _getBoundsForNode2.right,
      bRight = _getBoundsForNode2$ri === undefined ? bLeft : _getBoundsForNode2$ri,
      _getBoundsForNode2$bo = _getBoundsForNode2.bottom,
      bBottom = _getBoundsForNode2$bo === undefined ? bTop : _getBoundsForNode2$bo;

  return !(
  // 'a' bottom doesn't touch 'b' top
  aBottom - tolerance < bTop ||
  // 'a' top doesn't touch 'b' bottom
  aTop + tolerance > bBottom ||
  // 'a' right doesn't touch 'b' left
  aRight - tolerance < bLeft ||
  // 'a' left doesn't touch 'b' right
  aLeft + tolerance > bRight);
}

/**
 * Given a node, get everything needed to calculate its boundaries
 * @param  {HTMLElement} node
 * @return {Object}
 */
function getBoundsForNode(node) {
  if (!node.getBoundingClientRect) return node;

  var rect = node.getBoundingClientRect(),
      left = rect.left + pageOffset('left'),
      top = rect.top + pageOffset('top');

  return {
    top: top,
    left: left,
    right: (node.offsetWidth || 0) + left,
    bottom: (node.offsetHeight || 0) + top
  };
}

function pageOffset(dir) {
  if (dir === 'left') return window.pageXOffset || document.body.scrollLeft || 0;
  if (dir === 'top') return window.pageYOffset || document.body.scrollTop || 0;
}
exports.default = Selection;