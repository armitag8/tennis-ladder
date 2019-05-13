import React, { Component } from "react";
import LoginScreen from "./LoginScreen";
import LadderView from "./LadderView";
import NavBar from "./NavBar";
import GamesView from "./GamesView";
import ProfileView from "./ProfileView";
import "../style/Rules.css"

class RulesView extends Component{
    componentDidMount = () => this.props.user ? null : this.props.logout();

    render(){
        return (
            <div className="rules">
                <h2>Welcome to the Tennis Ladder</h2>
                <h3>Mission</h3>
                <p>
                    The objectives are to have fun and meet people to play with.
                    We welcome players of all skill levels.
                </p>
                <h3>Commitment</h3>
                <p>
                    By signing up for this ladder, you are committing to 
                    finding time to play at least one match per week. This is only
                    fair to the other players in the ladder.
                </p>
                <h3>Match Structure</h3>
                <p>
                    "Matches" are played as pro-sets up to 8 games. One must win by two games.
                    Ties of 8-8 are broken by tie-break games played to 10 points (first to win by 2).
                    Examples of final scores are therefore:
                </p>
                <ul>
                    <li>8-0</li>
                    <li>8-6</li>
                    <li>9-7</li>
                    <li>8-8, then tie-break: 10-8</li>
                    <li>8-8, then tie-break: 15-13</li>
                </ul>
                <h3>Questions</h3>
                <p>
                    Contact <a href="mailto:joe.armitage@mail.utoronto.ca">Joe Armitage</a>, 
                    or come chat with a court supervisor at the tennis courts.
                </p>
            </div>
        );
    }
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: null, 
            view: "rules",
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
            if (response.ok) this.setState({ user: null, view: "logout" });
            else response.text().then(msg => console.log(msg));
        }).catch(err => console.log(err));
    };

    authenticate = user => this.setState({ user: user }, () => this.setState({ view: "rules" }));

    switchView = view => this.setState({ view: view });

    render = () => {
        let views = {
            logout: <LoginScreen onAuthenticate={this.authenticate} logout={this.logout}/>,
            rules: <RulesView user={this.state.user} logout={this.logout}/>,
            ranking: <LadderView user={this.state.user} logout={this.logout}/>,
            games: <GamesView user={this.state.user} logout={this.logout}/>,
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