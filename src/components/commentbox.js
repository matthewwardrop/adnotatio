import React from 'react';
import PropTypes from 'prop-types';
import TextArea from 'react-textarea-autosize';
const KaTeX = require('katex');
import Comment from '../comment';
import CommentHeader from './commentheader';
import Underscore from 'underscore';
import HighlightJs from 'highlight.js';

import {greedyHandler} from '../utils/handlers';


export default class CommentBox extends React.Component {

    static propTypes = {
        comment: PropTypes.object,
        onClick: PropTypes.func,
        onMouseOver: PropTypes.func,
        onMouseOut: PropTypes.func,
        onHeightChange: PropTypes.func,
        onChange: PropTypes.func
    }

    constructor(props) {
        super(props);
        this.domDraftTextArea = null;
        this.state = {
            draft: this.props.comment.state.isDraft ? this.props.comment.copy() : undefined
        };
    }

    renderCommentString = (comment) => {
        return Underscore.escape(comment).replace(/(?:\$\$(.*?)\$\$)|(?:\\\[(.*?)\\\])|(?:\$(.*?)\$)|(?:\\\((.*?)\\\))/gs, function(outer, inner1, inner2, inner3, inner4, offset, string) {
            let displayMode = !!(inner1 || inner2);
            let inner = Underscore.unescape(inner1 || inner2 || inner3 || inner4);

            try {
                return KaTeX.renderToString(inner, { displayMode: displayMode });
            } catch (e) {
                if (e instanceof KaTeX.ParseError) {
                    console.log(e);
                    return "<span class='adnotatio-commentbar-latex-error' title='" + Underscore.escape(e.toString()) + "'>" + Underscore.escape(inner) + "</span>";
                } else {
                    throw e;
                }
            }
        }).replace(/&#x60;&#x60;&#x60;(?:\s*\n)*(.*?)(?:\s*\n\s)*&#x60;&#x60;&#x60;/gs, function (outer, inner, offset, string) {
            inner = Underscore.unescape(inner);
            let highlighted = HighlightJs.highlightAuto(inner);
            return `<code language='` + highlighted.language + `'>` + highlighted.value + `</code>`;
        }).replace(/&#x60;([^\n]*?)&#x60;/gs, function (outer, inner, offset, string) {
            inner = Underscore.unescape(inner);
            let highlighted = HighlightJs.highlightAuto(inner);
            return `<code class='inline' language='` + highlighted.language + `'>` + highlighted.value + `</code>`;
        });
    }

    get comment() {
        return this.state.draft || this.props.comment;
    }

    onEdit = () => {
        let comment = this.props.comment.copy();
        this.setState({draft: comment});
    }

    onSave = () => {
        this.props.onChange('update', this.comment);
        this.setState({draft: null});
    }

    onDiscard = () => {
        if (this.comment.state.isDraft) {
            this.props.onChange('discard', this.comment);
        } else {
            this.setState({
                draft: undefined
            })
        }
    }

    onResolve = () => {
        this.props.onChange('patch', this.comment, {isResolved: true});
    }

    componentDidMount() {
        if (this.domDraftTextArea !== null) {
            window.setTimeout(() => {this.domDraftTextArea.focus()}, 25);
        }
    }

    componentDidUpdate() {
        this.props.onHeightChange();
    }

    render() {
        let comment = this.comment;

        let hasDraft = this.state.draft || comment.replies.some(comment => {return comment.state.isDraft});

        return (
            <div
                data-comment-id={comment.uuid}
                data-is-active={this.props.isActive}
                className={
                    (comment.replyTo
                        ? 'adnotatio-commentbar-comment-reply'
                        : ('adnotatio-commentbar-comment' +
                            (
                                comment.isOrphan
                                ? ' adnotatio-commentbar-orphan'
                                : ''
                            )
                        )
                    )
                }
                onClick={comment.replyTo ? undefined : greedyHandler(!this.props.isActive ? this.props.onActivate : undefined)}
                onMouseOver={this.props.onMouseOver}
                onMouseOut={this.props.onMouseOut}
                style={comment.state.isDraft ? {transition: 'none', top: comment.state.offsetY} : null}
            >
                {this.props.isActive &&
                    <div className='adnotatio-commentbar-comment-arrow-outline'>
                        <div className='adnotatio-commentbar-comment-arrow-body' />
                    </div>
                }
                <CommentHeader comment={comment} actionMain="Resolve" actionMainCallback={() => this.onResolve()}/>
                {comment.annotations.length > 0 &&
                    <span className='adnotatio-commentbar-comment-highlighted'>{comment.annotationDescription}</span>
                }
                {this.state.draft ?
                    <>
                        <TextArea inputRef={(el) => {this.domDraftTextArea = el}} useCacheForDOMMeasurements onHeightChange={this.props.onHeightChange} onChange={(e) => {comment.text = e.target.value}}
                        defaultValue={comment.text} onKeyDown={(e) => {if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {comment.text = e.target.value; this.onSave()}}}/>
                        <button className="adnotation-commentbar-comment-save" onClick={greedyHandler(this.onSave)}>Save</button><button className="adnotation-commentbar-comment-discard" onClick={greedyHandler(this.onDiscard)}>Cancel</button>
                    </>
                    :
                    <span className='adnotatio-commentbar-comment-text' dangerouslySetInnerHTML={{__html: this.renderCommentString(comment.text)}} onClick={this.props.isActive && this.props.currentAuthor === comment.authorEmail ? this.onEdit : undefined}/>
                }
                <div className='adnotatio-commentbar-comment-replies'>
                    {comment.replies.sort((a,b) => a.ts_created - b.ts_created).map(reply => {
                        return <CommentBox key={reply.uuid} comment={reply} currentAuthor={this.props.currentAuthor} isActive={this.props.isActive} onChange={this.props.onChange} onHeightChange={this.props.onHeightChange} />
                    })}
                    {this.props.isActive && !hasDraft && this.props.onCommentReply &&
                        <div className='adnotatio-commentbar-comment-replyplaceholder'>
                            <input type='text' placeholder='Reply...' onClick={greedyHandler(() => this.props.onCommentReply(comment.uuid))}/>
                        </div>
                    }
                </div>

            </div>
        )
    }

}
