import React from 'react';
import PropTypes from 'prop-types';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SETTLE_RANGE = 0.001;
const ADDITIONAL_LIMIT = 0.2;
const DOUBLE_TAP_THRESHOLD = 300;
const ANIMATION_SPEED = 0.08;
const RESET_ANIMATION_SPEED = 0.1;
const INITIAL_X = 0;
const INITIAL_Y = 0;
const INITIAL_SCALE = 1;

const settle = (val, target, range) => {
  const lowerRange = val > target - range && val < target;
  const upperRange = val < target + range && val > target;
  return lowerRange || upperRange ? target : val;
};

const inverse = (x) => x * -1;

const getPointFromTouch = (touch, element) => {
  const rect = element.getBoundingClientRect(); 
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
};

const getMidpoint = (pointA, pointB) => ({
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
});

const getDistanceBetweenPoints = (pointA, pointB) => (
  Math.sqrt(Math.pow(pointA.y - pointB.y, 2) + Math.pow(pointA.x - pointB.x, 2))
);

const between = (min, max, value) => Math.min(max, Math.max(min, value));

const checkBetween = (m1, m2, value) => {
    return m1 < m2 ? between(m1, m2, value ) : between(m2, m1, value)
}

class PinchZoomPan extends React.Component {
  constructor() {
    super(...arguments);
    this.state = this.getInititalState();

    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    this.abortAnimation = false;
  }

  abortAnimationFrames() {
    if(this.animation) {
        this.abortAnimation = true; 
    }
  }

  updateInitialState() {
    console.log('--------------update initial state---------------');
    this.abortAnimationFrames();
    this.setState(this.getInititalState(), () => {
        this.abortAnimation = false;
    });
  }

  zoomTo(scale, midpoint) {
    const frame = () => {
      if (this.state.scale === scale) return null;

      const distance = scale - this.state.scale;
      const targetScale = this.state.scale + (ANIMATION_SPEED * distance);

    //   console.log('zoomTo - ' + targetScale + ' -- ' + scale);

      const newScale = settle(targetScale, scale, SETTLE_RANGE);
      
      if(this.abortAnimation || newScale == scale || (scale == 1 && newScale > 0.99 && newScale < 1)) {
        console.log('animation is aborted or animation target scale is same as previous.');
        this.zoom(scale, midpoint);
        return null;
      }

      this.zoom(newScale, midpoint);
      this.animation = requestAnimationFrame(frame);
    };

    this.animation = requestAnimationFrame(frame);
  }

  reset() {
    const frame = () => {
      if (this.state.scale === INITIAL_SCALE && this.state.x === INITIAL_X && this.state.y === INITIAL_Y) return null;
      const distance = INITIAL_SCALE - this.state.scale;
      const distanceX = INITIAL_X - this.state.x;
      const distanceY = INITIAL_Y - this.state.y;

      const targetScale = settle(this.state.scale + (RESET_ANIMATION_SPEED * distance), INITIAL_SCALE, SETTLE_RANGE);
      const targetX = settle(this.state.x + (RESET_ANIMATION_SPEED * distanceX), INITIAL_X, SETTLE_RANGE);
      const targetY = settle(this.state.y + (RESET_ANIMATION_SPEED * distanceY), INITIAL_Y, SETTLE_RANGE);

      const nextWidth = this.props.width * targetScale;
      const nextHeight = this.props.height * targetScale;

      this.setState({
        x: targetX,
        y: targetY,
        scale: targetScale,
        width: nextWidth,
        height: nextHeight,
      }, () => {
        this.animation = requestAnimationFrame(frame);
      });
    };

    this.animation = requestAnimationFrame(frame);
  }

  getInititalState() {
    return {
      x: INITIAL_X,
      y: INITIAL_Y,
      scale: INITIAL_SCALE,
      width: this.props.width,
      height: this.props.height,
    };
  }

  handleTouchStart(event) {
    console.log('touch start - ' + event.touches.length);

    this.animation && cancelAnimationFrame(this.animation);
    if (event.touches.length == 2) this.handlePinchStart(event);
    if (event.touches.length == 1) this.handleTapStart(event);
  }

  handleTouchMove(event) {
    if (event.touches.length == 2) this.handlePinchMove(event);
    if (event.touches.length == 1) this.handlePanMove(event);
  }

  handleTouchEnd(event) {
    if (event.touches.length > 0) return null;
    
    console.log('touch end');

    if (this.state.scale > MAX_SCALE) return this.zoomTo(MAX_SCALE, this.lastMidpoint);
    if (this.state.scale < MIN_SCALE) return this.zoomTo(MIN_SCALE, this.lastMidpoint);

    if (this.lastTouchEnd && this.lastTouchEnd + DOUBLE_TAP_THRESHOLD > event.timeStamp) {
        console.log('touch end reset');
        this.reset();
    }

    this.lastTouchEnd = event.timeStamp;
  }

  handleTapStart(event) {
    // console.log('tap start');
    // console.log(event.touches[0]);
    this.lastPanPoint = getPointFromTouch(event.touches[0], this.container);
  }

  handlePanMove(event) {
    if (this.state.scale === 1) return null;

    event.preventDefault();

    const point = getPointFromTouch(event.touches[0], this.container);
    const nextX = this.state.x + point.x - this.lastPanPoint.x;
    const nextY = this.state.y + point.y - this.lastPanPoint.y;

    // console.log('pan move start');
    // console.log(event.touches[0]);
    // console.log(this.container.getBoundingClientRect());
    // console.log(point);
    // console.log(this.lastPanPoint);

    const newX = between(this.props.width - this.state.width, 0, nextX);
    const newY = between(this.props.height - this.state.height, 0, nextY);

    // console.log('nextX = ' + nextX + ' -- nextY = ' + nextY);
    // console.log('newX = ' + newX + ' -- newX = ' + newY);

    // console.log('pan move end');

    this.setState({
      x: newX,
      y: newY,
    });

    this.lastPanPoint = point;
  }

  handlePinchStart(event) {
    const pointA = getPointFromTouch(event.touches[0], this.container);
    const pointB = getPointFromTouch(event.touches[1], this.container);
    this.lastDistance = getDistanceBetweenPoints(pointA, pointB);

    // console.log('pinch start - ' + this.lastDistance);
  }

  handlePinchMove(event) {
    event.preventDefault();
    const pointA = getPointFromTouch(event.touches[0], this.container);
    const pointB = getPointFromTouch(event.touches[1], this.container);
    const distance = getDistanceBetweenPoints(pointA, pointB);
    const midpoint = getMidpoint(pointA, pointB);
    const scale = between(MIN_SCALE - ADDITIONAL_LIMIT, MAX_SCALE + ADDITIONAL_LIMIT, this.state.scale * (distance / this.lastDistance));

    // console.log('pinch move start - ' + this.lastDistance);
    // console.log(this.container.getBoundingClientRect());
    // console.log(midpoint);
    // console.log(this.lastPanPoint);

    this.zoom(scale, midpoint);

    this.lastMidpoint = midpoint;
    this.lastDistance = distance;

    // console.log('x = ' + this.state.x + ' -- y = ' + this.state.y);
    // console.log('width = ' + this.state.width + ' -- height = ' + this.state.height);
    // console.log('pinch move end');
  }

  zoom(scale, midpoint) {
    const nextWidth = this.props.width * scale;
    const nextHeight = this.props.height * scale;
    const nextX = this.state.x + (inverse(midpoint.x * scale) * ((nextWidth - this.state.width) / nextWidth));
    const nextY = this.state.y + (inverse(midpoint.y * scale) * ((nextHeight - this.state.height) / nextHeight));

    // console.log('zoom start - ' + nextWidth + ' -- ' + nextHeight);
    // console.log('currX = ' + this.state.x + ' -- currY = ' + this.state.y);

    const x = checkBetween(0, this.props.width - nextWidth, nextX);
    const y = checkBetween(0, this.props.height - nextHeight, nextY);

    // console.log('nextX = ' + nextX + ' -- nextY = ' + nextY);
    // console.log('zoom end');

    this.setState({
      width: nextWidth,
      height: nextHeight,
      x: nextWidth <= this.props.width ? x : nextX,
      y: nextHeight <= this.props.height ? y : nextY,
      scale,
    });
  }

  render() {

    console.log('pinchzoompan - ' + this.state.x + ' -- ' + this.state.y + ' -- ' + this.state.width + ' -- ' + this.state.height + ' -- ' + this.state.scale);
    
    return (
      <div 
        ref={(ref) => this.container = ref}
        onTouchStart={this.handleTouchStart}
        onTouchMove={this.handleTouchMove}
        onTouchEnd={this.handleTouchEnd}
        style={{
          width: this.props.width,
          height: this.props.height,
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      > 
        {this.props.children(this.state.x, this.state.y, this.state.scale)} 
      </div>
    );
  }
}

PinchZoomPan.propTypes = {
  children: PropTypes.func.isRequired,
};

export default PinchZoomPan;