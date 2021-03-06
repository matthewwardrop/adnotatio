import Annotation from './base';
import { BoundingBox } from '../utils/bbox';
import { getViewportOffset } from '../utils/offset';
import { getXPath } from '../utils/xpath';
import { greedyHandler } from '../utils/handlers';

export default class DomHighlightAnnotation extends Annotation {

    static TYPE = 'highlight_dom';

    get description() {
        return this.spec.text;
    }

    isOrphaned(root) {
        return this.toRange(root) === null;
    }

    render(root, bglayer, fglayer, onclick = null, onmouseover = null, onmouseout = null) {
        const range = this.toRange(root);
        if (!range) return;

        const rootOffset = getViewportOffset(fglayer);
        const rects = range.getClientRects();

        const highlightContainer = document.createElement('div');
        highlightContainer.className = 'adnotatio-text-highlight';
        highlightContainer.style.top = '0px';
        highlightContainer.style.left = '0px';
        highlightContainer.style.width = '0px';
        highlightContainer.style.height = '0px';
        if (onclick) highlightContainer.onclick = greedyHandler(onclick);
        if (onmouseover) highlightContainer.onmouseover = onmouseover;
        if (onmouseout) highlightContainer.onmouseout = onmouseout;

        let minOffsetX = Infinity;
        let minOffsetY = Infinity;

        for (let i = 0; i !== rects.length; i++) {
            const rect = rects[i];
            const highlightDiv = document.createElement('div');
            minOffsetX = Math.min(minOffsetX, rect.left - rootOffset.left);
            minOffsetY = Math.min(minOffsetY, rect.top - rootOffset.top);
            highlightDiv.style.top = (rect.top - rootOffset.top) + 'px';
            highlightDiv.style.left = (rect.left - rootOffset.left) + 'px';
            highlightDiv.style.width = rect.width + 'px';
            highlightDiv.style.height = rect.height + 'px';
            highlightContainer.appendChild(highlightDiv);
        }

        highlightContainer.dataset.minOffsetX = minOffsetX;
        highlightContainer.dataset.minOffsetY = minOffsetY;

        fglayer.appendChild(highlightContainer);

        return highlightContainer;
    }

    getBoundingBox(root, bglayer, fglayer) {
        const range = this.toRange(root);
        const rects = range.getClientRects();
        const rootOffset = getViewportOffset(fglayer);

        let xMin = Infinity;
        let xMax = -Infinity;
        let yMin = Infinity;
        let yMax = -Infinity;

        for (let i = 0; i !== rects.length; i++) {
            const rect = rects[i];

            xMin = Math.min(xMin, rect.left);
            xMax = Math.max(xMax, rect.left + rect.width);
            yMin = Math.min(yMin, rect.top);
            yMax = Math.max(yMax, rect.top + rect.height);
        }
        return new BoundingBox(
            xMin - rootOffset.left, yMin - rootOffset.top, xMax - xMin, yMax - yMin
        );
    }

    // Conversion to and from DOM Range

    static fromRange(range, root) {
        return new this({
            ...this.getSpecBase(),
            text: range.toString(),
            startContext: {
                xpath: getXPath(range.startContainer, root),
                offset: range.startOffset,
            },
            endContext: {
                xpath: getXPath(range.endContainer, root),
                offset: range.endOffset,
            },
        });
    }

    toRange(root) {
        const range = document.createRange();

        try {
            range.setStart(document.evaluate(this.spec.startContext.xpath, root).iterateNext(), this.spec.startContext.offset);
            range.setEnd(document.evaluate(this.spec.endContext.xpath, root).iterateNext(), this.spec.endContext.offset);
            if (range.toString() !== this.spec.text) {
                return null;
            }
        } catch {
            return null;
        }

        return range;
    }

}
