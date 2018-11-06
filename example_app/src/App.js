import React, { Component } from 'react';
import Adnotatio, { LocalCommentStorage } from 'adnotatio';
import './App.css';
import 'katex/dist/katex.min.css';


class App extends Component {

    constructor(props) {
        super(props)
        this.state = {docID: 1};
    }

    renderDocument = () => {
        let word = this.state.docID === 1 ? "" : "supercalifragilisticexpialodotious";
        let misspelt = this.state.docID === 1 ? "spllg" : "spelling";
        return <>
            <h1>On the subject of persistent textual annotations</h1>
            <h2>Basic Highlighting behaviour</h2>
            <p>
                This is a paragraph. It never changes with document version.
            </p>
            This is just a text node directly embedded into this section.
            <h2>Local changes to the DOM</h2>
            <p>A long word will appear in the following parenthesis in some versions:
            ({word}). In some versions, it will be empty, leading to a change in the
            offset within text nodes.</p>
            <p>The spelling of "{misspelt}" will be corrected in future versions.</p>
            <h2>Complex DOM</h2>
            <p>{<>This paragraph</>} | {<>consists of</>} | {<>lots of small</>} | {<>text fragments</>}. {<>This one changes {this.state.docID === 1 ? "'this disappears''" : ""}.</>} {this.state.docID === 1 && <>This one disappears.</>}{<>This one remains.</>}{<>So does this one.</>}</p>
            <p>{this.state.docID === 1 ? <>Part of this text will be emboldened.</> : <>Part of <b>this text will</b> be emboldened.</>}</p>
            <h2>Gross changes to the DOM</h2>
            {this.state.docID > 1 &&
                <p>
                    A wild paragraph appeared!
                </p>
            }
            <p>A paragraph will appear above this one in versions 2 and 3
            of this document.</p>
            <p id='p-id'>This node is associated with a specific ID which allows for more
            ready preservation of annotations.</p>
            <h2>Random text</h2>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vitae condimentum ex. In rutrum scelerisque risus, sit amet hendrerit ligula molestie vel. Maecenas nec aliquam felis, quis luctus tortor. Ut egestas facilisis nibh, et
                semper purus porttitor quis. Etiam venenatis fermentum purus, in bibendum sapien sollicitudin vel. Cras non venenatis ante, eget vestibulum eros. Etiam quis enim arcu. Maecenas sollicitudin tincidunt libero non lobortis. Phasellus id
                odio cursus, facilisis arcu quis, dapibus sapien. Vestibulum venenatis, elit ac ultrices aliquam, tellus mi commodo turpis, et auctor libero leo a nulla. Nullam sed cursus nisl. Integer ultricies at tortor id mattis.
            </p>
            <p id='test2'>
                Sed eget ipsum nisi. Pellentesque id ante arcu. Quisque quis finibus turpis, ut laoreet justo. Nulla feugiat turpis pellentesque eros pulvinar, vitae eleifend risus scelerisque. Sed eget ex porttitor, dapibus ante quis, ornare purus.
                Sed efficitur lacus vitae lacus tempus maximus nec a erat. Mauris tempor nunc sem, at venenatis dui interdum sed. Pellentesque fermentum lacus in accumsan varius. In ultrices, turpis sit amet egestas pretium, dolor ex auctor sem, id
                lacinia ante dolor sit amet tellus. Nulla nec mauris vel lorem congue elementum. Cras eget mauris et turpis sollicitudin tempus a at augue. Aenean tincidunt congue magna sit amet maximus.
            </p>
            {this.state.docID === 1 &&
                <p id='test3'>
                    This paragraph will be deleted.
                    Sed blandit condimentum dictum. Donec non diam justo. Donec et justo mi. Pellentesque aliquam justo nibh, a posuere neque mollis sed. Vestibulum congue odio pretium, interdum velit in, eleifend mauris. Integer a posuere lorem. Nullam
                    vel mattis purus, sit amet scelerisque ipsum. Aliquam a volutpat lacus. Morbi imperdiet leo eget nunc maximus dictum.
                </p>
            }
            Donec sed velit quis orci iaculis condimentum. Nulla lobortis quis dolor eu accumsan. Phasellus sit amet lorem ipsum. Suspendisse dignissim, sem at fringilla ullamcorper, dolor nibh dignissim arcu, vitae tempor tortor dolor vel eros. Sed
            et nunc at massa finibus auctor vel aliquet sapien. Aenean consectetur venenatis sapien, id gravida odio egestas quis. Quisque sit amet nibh ipsum.

            Nullam suscipit est at mauris tincidunt, id elementum tortor suscipit. Aliquam gravida purus nec mauris interdum sodales. Duis imperdiet, neque vel congue vestibulum, quam lacus blandit arcu, ac sollicitudin nisl quam ac odio. Sed
            vestibulum gravida auctor. Quisque diam enim, cursus sed tortor eu, hendrerit laoreet odio. Nulla nec molestie eros, a ullamcorper ante. Nam sed laoreet dolor. Pellentesque lobortis lectus purus, id tempor turpis elementum in. Ut sit
            amet nulla a tortor lobortis ullamcorper ut at quam. Fusce euismod tempor purus, a hendrerit enim auctor non. Quisque aliquam dui gravida sem tincidunt feugiat. Vivamus a nunc malesuada, auctor tortor nec, faucibus odio. Integer erat
            ante, volutpat maximus ex at, fermentum posuere mauris.
        </>
    }

  render() {
    return (
      <div className="App">
        <Adnotatio storage={new LocalCommentStorage()}>
            <div className='document'>
                <button onClick={(e) => {this.setState({docID: 1})}}>Version 1</button>
                <button onClick={(e) => {this.setState({docID: 2})}}>Version 2</button><br />
                {this.renderDocument()}
            </div>
        </Adnotatio>
      </div>
    );
  }
}

export default App;
