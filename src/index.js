import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Container from './Container.js';
import './styles.css';

class App extends Component {
  render() {
    return <Container />;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
