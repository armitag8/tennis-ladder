import React, { Component } from "react";
import config from "../config";
import LoginScreen from "./LoginScreen";
import LadderView from "./LadderView";
import NavBar from "./NavBar";
import GamesView from "./GamesView";
import "../style/About.css";
import "../style/App.css";
import About from "./About";
import Privacy from "./Privacy";
import Admin from "./Admin";
import shortid from "shortid";
import ProfileView from "./ProfileView";


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: this.getAuthenticatedUser(), 
            view: this.getInvite() ? "login" : "about",
            errors: [],
            nav: false
        };
    }
    
    hideNav = () => this.setState(s => ({nav: ! s.nav}));

    onError = error => this.setState(state => ({ errors: state.errors.concat([error])}), () =>
        setTimeout(() => this.setState(state => ({ errors: state.errors.slice(1)})), 5000));

    getAuthenticatedUser = () => decodeURIComponent(
        document.cookie.replace(/(?:(?:^|.*;\s*)user\s*=\s*([^;]*).*$)|^.*$/, "$1")
    );

    getInvite = () => decodeURIComponent(
        document.cookie.replace(/(?:(?:^|.*;\s*)invite\s*=\s*([^;]*).*$)|^.*$/, "$1")
    );

    logout = () => {
        fetch(new Request("/api/user/", {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        }))
        .then(response => {
            if (response.ok) this.setState({ user: null, view: "login" });
            else response.text().then(msg => console.log(msg));
        }).catch(err => console.log(err));
    };

    authenticate = user => this.setState({ user: user }, () => this.setState({ view: "ranking" }));

    switchView = view => this.setState({ view: view });

    render = () => {
        let views = {};
        if (this.state.user === config.admin || config.mods.includes(this.state.user))
            views.admin = <Admin user={this.state.user} logout={this.logout} onError={this.onError}/>;
        views.login = <LoginScreen onAuthenticate={this.authenticate} logout={this.logout}/>;
        views.about = <About user={this.state.user} logout={this.logout}/>;
        views.privacy = <Privacy user={this.state.user} logout={this.logout}/>;
        if (this.state.user) {
            views.ranking = <LadderView user={this.state.user} logout={this.logout} onError={this.onError}/>;
            views.matches = <GamesView user={this.state.user} logout={this.logout} onError={this.onError}/>;
            views.profile = <ProfileView user={this.state.user} logout={this.logout} onError={this.onError}/>;
            delete Object.assign(views, {"logout": views.login }).login;
        }
        return (
            <div>
                <NavBar 
                    nav={this.state.nav}
                    changeView={this.switchView} 
                    logout={this.logout} 
                    view={this.state.view}
                    views={Object.keys(views)}
                    hideNav={this.hideNav}
                />
                <div onClick={() => this.setState({ nav: false })} className="view">
                    {views[this.state.view]
                }</div>
                <div className="errors">
                    {this.state.errors.map(error => 
                        <Error key={shortid.generate()} message={error.message}/>)}
                </div>
            </div>
        );
    };
}

class Error extends Component {
    render = () => <div className="error">{this.props.message}</div>
}

export default App;
