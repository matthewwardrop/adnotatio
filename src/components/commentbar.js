import React from 'react';
import Comment from '../comment';
import CommentBox from './commentbox';


export default class CommentBar extends React.Component {

    constructor(props) {
        super(props);
        this.commentContainer = React.createRef();

        let comment = Object.values(this.props.comments).find((comment) => comment.state.isDraft);
        this.state = {activeComment: comment ? comment.uuid : null};
    }

    activateComment = (uuid) => {
        this.setState({activeComment: uuid});
    }

    focusComment = (uuid) => {
        this.commentContainer.current.querySelectorAll('div[data-comment-id="' + uuid + '"]').forEach((el) => {
            el.dataset.focussed = "true";
        })
    }

    unfocusComment = (uuid) => {
        this.commentContainer.current.querySelectorAll('div[data-comment-id="' + uuid + '"]').forEach((el) => {
            el.dataset.focussed = "false";
        })
    }

    renderOffsets = () => {
        let elements = [...this.commentContainer.current.children];

        let orphanCount = Object.values(this.props.comments).filter(el => el.state.isOrphan).length;

        let getState = (el) => {
            let comment = this.props.comments[el.dataset.commentId];
            if (comment && !comment.state.isOrphan && comment.state.annotationBBox) {
                return {
                    x: comment.state.annotationBBox.left,
                    y: comment.state.annotationBBox.top,
                    isOrphan: false
                };
            }
            return {isOrphan: true};
        };

        // sort comments
        elements = elements.sort((a,b) => {

            let aState = getState(a);
            let bState = getState(b);

            if (a.className == 'adnotatio-commentbar-orphanheader') {
                if (bState.isOrphan) {
                    return -1;
                } else {
                    return 1;
                }
            } else if (b.className == 'adnotatio-commentbar-orphanheader') {
                if (aState.isOrphan) {
                    return -1;
                } else {
                    return 1;
                }
            }

            if (aState.y === undefined) {
                return 1;
            } else if (bState.y === undefined) {
                return -1;
            }

            if (aState.y < bState.y) {
                return -1;
            } else if (aState.y > bState.y) {
                return 1;
            } else {
                if (aState.x < bState.x) {
                    return -1;
                } else if (aState.x > bState.x) {
                    return 1;
                } else {
                    return 0;
                }
            }
        })

        var bottom = 0;

        let referenceIndex = Math.max(
            0,
            this.state.activeComment
            ? elements.findIndex(element => {return element.dataset.commentId === this.state.activeComment && !this.props.comments[element.dataset.commentId].state.isOrphan})
            : 0
        );

        let aboveReference = elements.slice(0, referenceIndex);
        let belowReference = elements.slice(referenceIndex);
        let minAboveOffset = Infinity;
        let minBelowOffset = 0;

        let elementHeight = (el) => {
            return (
                el.offsetHeight
                + parseFloat(window.getComputedStyle(el).getPropertyValue('margin-top'))
                + parseFloat(window.getComputedStyle(el).getPropertyValue('margin-bottom'))
            )
        };

        // Elements above reference index need to be computed in reverse order
        elements.slice(0, referenceIndex + 1).reverse().forEach(el => {
            let state = getState(el);

            let height = elementHeight(el);
            let y_offset = Math.min(minAboveOffset - height, (state.y || 0));
            el.style.top = y_offset + 'px';

            minAboveOffset = y_offset;
        })

        elements.slice(referenceIndex).forEach(el => {

            let state = getState(el);

            let y_offset = Math.max(minBelowOffset, state.y || 0);
            el.style.top = y_offset + 'px';

            if (el.className == 'adnotatio-commentbar-orphanheader') {
                if (orphanCount > 0) {
                    el.style.display = 'block';
                } else {
                    el.style.display = 'none';
                }
            } else {
                if (state.isOrphan) el.className = 'adnotatio-commentbar-comment adnotatio-commentbar-orphan'
                else el.className = 'adnotatio-commentbar-comment'
            }

            minBelowOffset = y_offset + el.offsetHeight;
            minBelowOffset += parseInt(window.getComputedStyle(el).getPropertyValue('margin-top'));
            minBelowOffset += parseInt(window.getComputedStyle(el).getPropertyValue('margin-bottom'));
        })
    }

    render() {
        return <div className="adnotatio-commentbar" ref={this.commentContainer}>
            {Object.values(this.props.comments).map(comment => {
                return <CommentBox
                        isActive={comment.uuid === this.state.activeComment || comment.state.isDraft}
                        key={comment.uuid}
                        comment={comment}
                        currentAuthor={this.props.currentAuthor}
                        onActivate={() => {this.activateComment(comment.uuid)}}
                        onCommentReply={() => {this.props.onCommentReply(comment.uuid)}}
                        onMouseOver={() => {this.props.focusAnnotations(comment.uuid)}}
                        onMouseOut={() => {this.props.unfocusAnnotations(comment.uuid)}}
                        onHeightChange={(height, instance) => {this.renderOffsets()}}
                        onChange={this.props.onCommentChange} />
            })}
            <span className='adnotatio-commentbar-orphanheader' key='orphanTitle'>Orphans</span>
        </div>
    }
}
