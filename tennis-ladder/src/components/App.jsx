import React, { Component } from 'react';
import LoginScreen from './LoginScreen.jsx';
//import AccountScreen from './AccountScreen.jsx';

/**
 * Displays either a SourceClipper, a Compilation Editor, or a Login Screen.
 */
class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: null, 
            view: "login", 
        };
    }

    componentDidMount = () => {
        let username = document.cookie.replace(/(?:(?:^|.*;\s*)username\s*=\s*([^;]*).*$)|^.*$/, "$1")
        this.authenticate(username || null);
    }

    logout = () => {
        fetch(new Request('/api/signout/', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: null
        }))
        .then(response => {
            if (response.ok) this.authenticate(null);
            else response.text().then(msg => console.log(msg));
        }).catch(err => console.log(err));
    };

    authenticate = user => {
        let view = user ? "sources" : "login";
        this.setState({ user: user }, () => this.switchView(view));
    };

    switchView = view => this.setState({ view: view });

    render = () => {
        let views = {
            login: (<LoginScreen
                view={this.state.view}
                onAuthenticate={this.authenticate}
            />),
        };
        return views[this.state.view];
    };
}

export default App;