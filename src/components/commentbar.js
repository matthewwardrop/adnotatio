import Comment from '../comment';
import CommentBox from './commentbox';
import PropTypes from 'prop-types';
import React from 'react';

export default class CommentBar extends React.Component {

    static propTypes = {
        comments: PropTypes.objectOf(PropTypes.instanceOf(Comment)),
        currentAuthor: PropTypes.string, // Author email

        focusAnnotations: PropTypes.func,
        unfocusAnnotations: PropTypes.func,
        onCommentChange: PropTypes.func,
        onCommentReply: PropTypes.func,
    }

    constructor(props) {
        super(props);
        this.commentContainer = React.createRef();

        const comment = Object.values(this.props.comments).find((comment) => comment.state.editing);
        this.state = { activeComment: comment ? comment.uuid : null };
    }

    activateComment = (uuid) => {
        this.setState({ activeComment: uuid });
    }

    focusComment = (uuid) => {
        this.commentContainer.current.querySelectorAll('div[data-comment-id="' + uuid + '"]').forEach((el) => {
            el.dataset.focussed = 'true';
        });
    }

    unfocusComment = (uuid) => {
        this.commentContainer.current.querySelectorAll('div[data-comment-id="' + uuid + '"]').forEach((el) => {
            el.dataset.focussed = 'false';
        });
    }

    renderOffsets = () => {
        let elements = [...this.commentContainer.current.children];

        const orphanCount = Object.values(this.props.comments).filter(el => el.state.isOrphan).length;

        const getState = (el) => {
            const comment = this.props.comments[el.dataset.commentId];
            if (comment && !comment.state.isOrphan && comment.state.annotationBBox) {
                return {
                    x: comment.state.annotationBBox.left,
                    y: comment.state.annotationBBox.top,
                    isOrphan: false,
                };
            }
            return { isOrphan: true };
        };

        // sort comments
        elements = elements.sort((a, b) => {

            const aState = getState(a);
            const bState = getState(b);

            if (a.className === 'adnotatio-commentbar-orphanheader') {
                if (bState.isOrphan) {
                    return -1;
                } else {
                    return 1;
                }
            } else if (b.className === 'adnotatio-commentbar-orphanheader') {
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
        });

        const referenceIndex = Math.max(
            0,
            this.state.activeComment
                ? elements.findIndex(element => { return element.dataset.commentId === this.state.activeComment && !this.props.comments[element.dataset.commentId].state.isOrphan; })
                : 0
        );

        let minAboveOffset = Infinity;
        let minBelowOffset = 0;

        const elementHeight = (el) => {
            return (
                el.offsetHeight +
                parseFloat(window.getComputedStyle(el).getPropertyValue('margin-top')) +
                parseFloat(window.getComputedStyle(el).getPropertyValue('margin-bottom'))
            );
        };

        // Elements above reference index need to be computed in reverse order
        elements.slice(0, referenceIndex + 1).reverse().forEach(el => {
            const state = getState(el);

            const height = elementHeight(el);
            const yOffset = Math.min(minAboveOffset - height, (state.y || 0));
            el.style.top = yOffset + 'px';

            minAboveOffset = yOffset;
        });

        elements.slice(referenceIndex).forEach(el => {

            const state = getState(el);

            const yOffset = Math.max(minBelowOffset, state.y || 0);
            el.style.top = yOffset + 'px';

            if (el.className === 'adnotatio-commentbar-orphanheader') {
                if (orphanCount > 0) {
                    el.style.display = 'block';
                } else {
                    el.style.display = 'none';
                }
            } else {
                if (state.isOrphan) el.className = 'adnotatio-commentbar-comment adnotatio-commentbar-orphan';
                else el.className = 'adnotatio-commentbar-comment';
            }

            minBelowOffset = yOffset + el.offsetHeight;
            minBelowOffset += parseInt(window.getComputedStyle(el).getPropertyValue('margin-top'));
            minBelowOffset += parseInt(window.getComputedStyle(el).getPropertyValue('margin-bottom'));
        });
    }

    render() {
        return <div className="adnotatio-commentbar" ref={this.commentContainer}>
            {Object.values(this.props.comments).map(comment => {
                return <CommentBox
                    isActive={comment.uuid === this.state.activeComment || comment.state.editing}
                    key={comment.uuid}
                    comment={comment}
                    currentAuthor={this.props.currentAuthor}
                    onActivate={() => { this.activateComment(comment.uuid); }}
                    onCommentReply={() => { this.props.onCommentReply(comment.uuid); }}
                    onMouseOver={() => { this.props.focusAnnotations(comment.uuid); }}
                    onMouseOut={() => { this.props.unfocusAnnotations(comment.uuid); }}
                    onHeightChange={() => { this.renderOffsets(); }}
                    onChange={this.props.onCommentChange} />;
            })}
            <span className='adnotatio-commentbar-orphanheader' key='orphanTitle'>Orphans</span>
        </div>;
    }

}
