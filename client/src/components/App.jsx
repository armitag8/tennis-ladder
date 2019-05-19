import React, { Component } from "react";
import LoginScreen from "./LoginScreen";
import LadderView from "./LadderView";
import NavBar from "./NavBar";
import GamesView from "./GamesView";
import "../style/Rules.css";
import Rules from "./Rules";
import Privacy from "./Privacy";
//import ProfileView from "./ProfileView";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: this.getAuthenticatedUser(), 
            view: "rules",
        };
    }

    getAuthenticatedUser = () => decodeURIComponent(
        document.cookie.replace(/(?:(?:^|.*;\s*)user\s*=\s*([^;]*).*$)|^.*$/, "$1") || null
    );

    logout = () => {
        fetch(new Request("/api/user/", {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        }))
        .then(response => {
            if (response.ok) this.setState({ user: null, view: "logout" });
            else response.text().then(msg => console.log(msg));
        }).catch(err => console.log(err));
    };

    authenticate = user => this.setState({ user: user }, () => this.setState({ view: "rules" }));

    switchView = view => this.setState({ view: view });

    render = () => {
        let views = {
            logout: <LoginScreen onAuthenticate={this.authenticate} logout={this.logout}/>,
            rules: <Rules user={this.state.user} logout={this.logout}/>,
            ranking: <LadderView user={this.state.user} logout={this.logout}/>,
            games: <GamesView user={this.state.user} logout={this.logout}/>,
            privacy: <Privacy user={this.state.user} logout={this.logout}/>
            //profile: <ProfileView/>,
        };
        return (
            <div>
                {! this.state.user ? null :
                    <NavBar 
                        changeView={this.switchView} 
                        logout={this.logout} 
                        view={this.state.view}
                        views={Object.keys(views)}
                    />}
                {views[this.state.view]}
            </div>
        );
    };
}

export default App;