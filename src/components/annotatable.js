import Annotation from '../annotations/base';
import AnnotationFactory from '../annotations/factory';
import CommentBar from './commentbar';
import CommentStorage from '../storage/base';
import DomHighlightAnnotation from '../annotations/highlight_dom';
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LocalCommentStorage from '../storage/local';
import PropTypes from 'prop-types';
import React from 'react';

export default class Annotatable extends React.Component {

    static DEFAULT_ANNOTATION_CLASSES = [
        DomHighlightAnnotation,
    ];

    static propTypes = {
        authority: PropTypes.string,
        documentId: PropTypes.string,
        documentVersion: PropTypes.string,
        documentAuthorEmails: PropTypes.arrayOf(PropTypes.string),
        documentUri: PropTypes.string,

        useKaTeX: PropTypes.bool,

        storage: PropTypes.instanceOf(CommentStorage),
        annotationClasses: PropTypes.arrayOf(function(propValue, key, componentName, location, propFullName) {
            if (!(propValue[key].prototype instanceof Annotation)) {
                return new Error('`annotationClasses` must be a list of subclasses of `Annotation`.');
            }
        }),

        children: PropTypes.element,
    }

    constructor(props) {
        super(props);

        // Document context
        this.documentContext = {
            authority: this.props.authority || null,
            documentId: this.props.documentId || null,
            documentVersion: this.props.documentVersion || null,
            documentAuthorEmails: this.props.documentAuthorEmails || null,
            documentUri: this.props.documentUri || null,
        };

        // DOM references
        this.wrapper = React.createRef();
        this.document = React.createRef();
        this.bglayer = React.createRef();
        this.fglayer = React.createRef();
        this.commentbar = React.createRef();
        this.commentButton = React.createRef();

        // Storage for comments and annotations
        this.storage = this.props.storage || new LocalCommentStorage();

        // Register annotation classes
        this.annotationFactory = new AnnotationFactory(
            this.constructor.DEFAULT_ANNOTATION_CLASSES.concat(this.props.annotationClasses || [])
        );

        this.state = { comments: {} };
    }

    // Component lifecycle methods

    componentDidMount() {
        window.addEventListener('resize', this.onWindowResize);
        this.storage.connect(this.documentContext, this.annotationFactory, this.onCommentsUpdate);
        this.componentDidUpdate();
        try {
            this.mutationObserver = new window.MutationObserver(this.onDocumentUpdate);
            this.mutationObserver.observe(this.document.current, { attributes: true, childList: true, subtree: true });
        } catch {}
    }

    componentDidUpdate() {
        while (this.bglayer.current.firstChild) {
            this.bglayer.current.removeChild(this.bglayer.current.firstChild);
        }
        while (this.fglayer.current.firstChild) {
            this.fglayer.current.removeChild(this.fglayer.current.firstChild);
        }
        this.renderAnnotations();
    }

    componentWillUnmount() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            delete this.mutationObserver;
        }
        window.removeEventListener('resize', this.onWindowResize);
        this.storage.disconnect();
    }

    // Component rendering

    renderAnnotations = () => {
        if (Object.values(this.state.comments).length === 0) return;
        Object.values(this.state.comments).forEach((comment) => {
            comment.renderAnnotations(
                this.document.current, this.bglayer.current, this.fglayer.current,
                this.onAnnotationClick, this.onAnnotationMouseOver, this.onAnnotationMouseOut
            );
        });
        this.commentbar.current.renderOffsets();
    }

    render() {
        return (
            <div className='adnotatio-wrapper' ref={this.wrapper} onClick={this.onDocumentClick}>
                <div className='adnotatio-document-wrapper'>
                    <button className="adnotatio-comment-button" ref={this.commentButton} onClick={this.onCommentCreate} style={{ display: 'none' }}><FontAwesomeIcon icon={faCommentDots} /></button>
                    <div className="adnotatio-document-bg" ref={this.bglayer} />
                    <div className="adnotatio-document-main" ref={this.document} onMouseUp={this.onDocumentMouseUp}>
                        {this.props.children}
                    </div>
                    <div className="adnotatio-document-fg" ref={this.fglayer} />
                </div>
                {Object.values(this.state.comments).length > 0 &&
                    <CommentBar comments={this.state.comments} currentAuthor={this.storage.author.email || null} onCommentChange={this.onCommentChange} onCommentReply={this.onCommentReply} focusAnnotations={this.focusAnnotations} unfocusAnnotations={this.unfocusAnnotations} ref={this.commentbar} />
                }
            </div>
        );
    }

    // Global event handlers

    onWindowResize = () => {
        this.forceUpdate();
    }

    onDocumentUpdate = () => {
        this.forceUpdate();
    }

    onDocumentClick = (e) => {
        // Add annotation for image. // TODO!
        if (this.commentbar.current) this.commentbar.current.activateComment(null);
    }

    onDocumentMouseUp = (e) => {
        // Check for text selection, and if present, offer opportunity to create
        // text highlight annotation.
        const currentSelection = window.getSelection();
        if (currentSelection.isCollapsed) {
            this.commentButton.current.style.display = 'none';
        } else {
            this.commentButton.current.style.top = ((document.documentElement.scrollTop || document.body.scrollTop) + currentSelection.getRangeAt(0).getClientRects()[0].y - this.wrapper.current.offsetTop) + 'px';
            this.commentButton.current.dataset.annotationType = 'highlight_dom';
            this.commentButton.current.style.display = 'block';
        }
    }

    onCommentCreate = (e) => {
        e.stopPropagation();
        if (this.commentButton.current.dataset.annotationType !== 'highlight_dom') {
            throw new Error('Adnotatio only support DOM highlights for now.');
        }

        const selection = window.getSelection();
        if (selection.toString() === '') {
            return;
        }

        const comment = this.storage.create({ state: { editing: true } });

        let bbox;
        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            const annotation = this.annotationFactory.classForType('highlight_dom').fromRange(range, this.document.current);
            bbox = annotation.getBoundingBox(this.document.current, this.bglayer.current, this.fglayer.current).union(bbox);
            comment.addAnnotation(annotation);
        }

        comment.state.annotationBBox = bbox;
        this.storage.stage(comment);
        if (this.commentbar.current) this.commentbar.current.activateComment(comment.uuid);

        this.commentButton.current.style.display = 'none';
        this.commentButton.current.dataset.annotationType = null;
        selection.empty();
    }

    // Hooks and event handlers called by children components

    onCommentsUpdate = (comments) => {
        // Convert a list of comments to a nested structure

        const out = {};

        comments = comments.sort((a, b) => {
            if (a.replyTo === null && b.replyTo !== null) {
                return -1;
            } else if (a.replyTo !== null && b.replyTo === null) {
                return 1;
            } else {
                return 0;
            }
        });

        comments.forEach((comment) => {
            if (!comment.isResolved) {
                if (comment.replyTo && comment.replyTo in out) {
                    out[comment.replyTo].addReply(comment.copyWithState());
                } else if (!comment.replyTo) {
                    out[comment.uuid] = comment.copyWithState();
                }
            }
        });

        this.setState({ comments: out });
    }

    onCommentChange = (action, comment, patch) => {
        if (action === 'discard') {
            this.storage.discard(comment);
        } else if (action === 'update') {
            if (comment.isDraft) {
                this.storage.add(comment);
            } else {
                this.storage.update(comment);
            }
        } else if (action === 'patch') {
            this.storage.patch(comment, patch);
        } else {
            throw new Error('Unknown action: ' + action);
        }
    }

    onCommentReply = (parentUuid) => {
        if (!this.storage.exists(parentUuid)) {
            throw new Error('Invalid comment: ' + parentUuid);
        }

        const reply = this.storage.create({ replyTo: parentUuid, state: { editing: true } });
        this.storage.stage(reply);
    }

    focusAnnotations = (uuid) => {
        this.fglayer.current.querySelectorAll('div[data-comment-id="' + uuid + '"]').forEach((el) => {
            el.dataset.focussed = 'true';
        });
    }

    unfocusAnnotations = (uuid) => {
        this.fglayer.current.querySelectorAll('div[data-comment-id="' + uuid + '"]').forEach((el) => {
            el.dataset.focussed = 'false';
        });
    }

    onAnnotationClick = (uuid) => {
        // activate comment
        this.commentbar.current.activateComment(uuid);
    }

    onAnnotationMouseOver = (uuid) => {
        // highlight annotation and comment
        this.commentbar.current.focusComment(uuid);
    }

    onAnnotationMouseOut = (uuid) => {
        // relax annotation and comment
        this.commentbar.current.unfocusComment(uuid);
    }

}
