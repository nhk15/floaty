import {EventEmitter}  from 'eventemitter3';
import getPosition from './getPosition';

export interface IDraggableEvent {
    originalEvent: MouseEvent;
    position: {x: number, y: number};
}

export interface IDraggableEventWithDelta extends IDraggableEvent {
    dx: number;
    dy: number;
}

export default function Draggable(element: HTMLElement, threshold: number = 0): EventEmitter {
    const emitter = new EventEmitter();
    let down = false;
    let dragging = false;
    let start = {x: 0, y: 0};
    let current = {x: 0, y: 0};

    function distance(a: {x: number, y: number}, b: {x: number, y: number}) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    function handleUp(event: MouseEvent | TouchEvent) {
        if (down) {
            down = false;
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchend', handleUp);

            if (dragging) {
                dragging = false;
                current = getPosition(event);
                emitter.emit('dragstop', {dx: current.x - start.x, dy: current.y - start.y, position: current, originalEvent: event});
            }
        }
    }

    function handleMove(event: MouseEvent | TouchEvent) {
        if (down) {
            current = getPosition(event);

            if (!dragging) {
                if (distance(start, current) >= threshold) {
                    dragging = true;
                    emitter.emit('dragstart', {position: start, originalEvent: event});
                    emitter.emit('drag', {dx: current.x - start.x, dy: current.y - start.y, position: current, originalEvent: event});
                }
            } else {
                emitter.emit('drag', {dx: current.x - start.x, dy: current.y - start.y, position: current, originalEvent: event});
            }
        }
    }

    function handleDown(event: MouseEvent | TouchEvent) {
        if (!down && !dragging) {
            down = true;
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('touchmove', handleMove);
            document.addEventListener('mouseup', handleUp);
            document.addEventListener('touchend', handleUp);
            current = start = getPosition(event);

            if (threshold <= 0) {
                dragging = true;
                emitter.emit('dragstart', {position: current, originalEvent: event});
            }
        }
    }

    element.addEventListener('mousedown', handleDown);
    element.addEventListener('touchstart', handleDown);

    emitter.on('destroy', () => {
        element.removeEventListener('mousedown', handleDown);
        element.removeEventListener('touchstart', handleDown);
        if (down) {
            down = false;
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchend', handleUp);
        }
        emitter.emit('destroyed');
    });

    return emitter;
};
