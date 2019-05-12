import React, { Component } from "react";
import LoginScreen from "./LoginScreen";
import LadderView from "./LadderView";
import NavBar from "./NavBar";
import GamesView from "./GamesView";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: null, 
            view: "login",
        };
    }

    componentDidMount = () => {
        let username = document.cookie.replace(/(?:(?:^|.*;\s*)user\s*=\s*([^;]*).*$)|^.*$/, "$1");
        this.authenticate(decodeURIComponent(username) || null);
    }

    logout = () => {
        fetch(new Request("/api/user/", {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        }))
        .then(response => {
            if (response.ok) this.authenticate(null);
            else response.text().then(msg => console.log(msg));
        }).catch(err => console.log(err));
    };

    authenticate = user => {
        let view = user ? "ranking" : "login";
        this.setState({ user: user }, () => this.switchView(view));
    };

    switchView = view => this.setState({ view: view });

    render = () => {
        let views = {
            login: (<LoginScreen
                onAuthenticate={this.authenticate}
            />),
            ranking: <LadderView user={this.state.user}/>,
            games: <GamesView />,
            profile: <div/>
        };
        return (
            <div>
                <NavBar user={this.state.user} changeView={this.switchView} logout={this.logout}/>
                {views[this.state.view]}
            </div>
        );
    };
}

export default App;