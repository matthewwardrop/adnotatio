import React from 'react';
import PropTypes from 'prop-types';
import TextArea from 'react-textarea-autosize';
const KaTeX = require('katex');
import Comment from '../comment';
import CommentHeader from './commentheader';
import Underscore from 'underscore';
import HighlightJs from 'highlight.js';
import 'highlight.js/styles/github.css'


import {greedyHandler} from '../utils.js';


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
        this.state = {
            comment: this.props.comment.copy(),
            edit: this.props.comment.isDraft
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            comment: nextProps.comment.copy(),
            edit: nextProps.comment.isDraft
        });
    }

    renderCommentString = (comment) => {
        return Underscore.escape(comment).replace(/(?:\$\$(.*?)\$\$)|(?:\\\[(.*?)\\\])|(?:\$(.*?)\$)|(?:\\\((.*?)\\\))/g, function(outer, inner1, inner2, inner3, inner4, offset, string) {
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
        }).replace(/&#x60;&#x60;&#x60;(.*?)&#x60;&#x60;&#x60;/, function (outer, inner, offset, string) {
            let highlighted = HighlightJs.highlightAuto(inner);
            return `<code language='` + highlighted.language + `'>` + highlighted.value + `</code>`;
        }).replace(/&#x60;(.*?)&#x60;/, function (outer, inner, offset, string) {
            let highlighted = HighlightJs.highlightAuto(inner);
            return `<code class='inline' language='` + highlighted.language + `'>` + highlighted.value + `</code>`;
        });
    }

    onSave = () => {
        this.props.onChange('update', this.state.comment);
    }

    onDiscard = () => {
        if (this.state.comment.isDraft) {
            this.props.onChange('discard', this.state.comment);
        } else {
            this.setState({
                comment: this.props.comment.copy(),
                edit: false
            })
        }
    }

    onResolve = () => {
        this.state.comment.isResolved = true;
        this.props.onChange('update', this.state.comment);
    }

    componentDidUpdate() {
        this.props.onHeightChange();
    }

    render() {
        let comment = this.state.comment;

        let hasDraft = comment.replies.some(comment => {return comment.isDraft});

        return (
            <div
                data-comment-id={comment.uuid}
                data-is-active={this.props.isActive}
                data-y-offset={comment.y_offset}
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
            >
                {this.props.isActive &&
                    <div className='adnotatio-commentbar-comment-arrow-outline'>
                        <div className='adnotatio-commentbar-comment-arrow-body' />
                    </div>
                }
                <CommentHeader comment={comment} actionMain="Resolve" actionMainCallback={() => this.onResolve()}/>
                {comment.annotations.length > 0 &&
                    <span className='adnotatio-commentbar-comment-highlighted'>{comment.annotations[0].highlighted_text}</span>
                }
                {this.state.edit ?
                    <>
                        <TextArea autoFocus useCacheForDOMMeasurements onHeightChange={this.props.onHeightChange} onChange={(e) => {comment.text = e.target.value}}
                        defaultValue={comment.text} onKeyDown={(e) => {if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {comment.text = e.target.value; this.onSave()}}}/>
                        <button className="adnotation-commentbar-comment-save" onClick={greedyHandler(this.onSave)}>Save</button><button className="adnotation-commentbar-comment-discard" onClick={greedyHandler(this.onDiscard)}>Cancel</button>
                    </>
                    :
                    <span className='adnotatio-commentbar-comment-text' dangerouslySetInnerHTML={{__html: this.renderCommentString(comment.text)}} onClick={this.props.isActive ? () => {this.setState({edit: true})} : undefined}/>
                }
                <div className='adnotatio-commentbar-comment-replies'>
                    {comment.replies.map(reply => {
                        return <CommentBox key={reply.uuid} comment={reply} isActive={this.props.isActive} onChange={this.props.onChange} onHeightChange={this.props.onHeightChange} />
                    })}
                    {this.props.isActive && !hasDraft && this.props.onCommentReply &&
                        <div className='adnotatio-commentbar-comment-replyplaceholder'>
                            <input type='text' placeholder='Reply..' onClick={greedyHandler(() => this.props.onCommentReply(comment.uuid))}/>
                        </div>
                    }
                </div>

            </div>
        )
    }

}