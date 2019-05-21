import React, { Component } from 'react';
import '../style/LadderView.css';
import Button from "./Button";
import NewGameForm from "./NewGameForm";

const withInfiniteScroll = (Component) =>
    class WithInfiniteScroll extends React.Component {
        componentDidMount() {
            window.addEventListener('scroll', this.onScroll, false);
        }

        componentWillUnmount() {
            window.removeEventListener('scroll', this.onScroll, false);
        }

        onScroll = () => {
            if (
                (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 500) &&
                this.props.players.length
            ) {
                this.props.onNextPage();
            }
        }

        render() {
            return <Component {...this.props} />;
        }
    }


class Ladder extends Component {
    render = () => (
        <div>
            {this.props.players.map(player =>
                <PlayerRow
                    user={this.props.user}
                    key={player._id}
                    _id={player._id}
                    position={player.position}
                    firstname={player.firstname}
                    lastname={player.lastname}
                    wins={player.wins}
                    losses={player.losses}
                    updatePlayers={this.props.updatePlayers}
                    onError={this.props.onError}
                />)}
        </div>
    );
}

const InfiniteLadder = withInfiniteScroll(Ladder);

class LadderView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            _id: "",
            week: 1,
            players: [],
            page: 0
        };
    }

    getPage = page => fetch(`/api/user/?page=${page}`)
        .then(response => {
            if (response.status === 200)
                response.json().then(users => this.setState(state =>
                    ({ 
                        players: page === 0 ? users : state.players.concat(users),
                        page: page 
                    })));
            else if (response.status === 401)
                this.props.logout();
            else
                console.log(response);
        }).catch(console.log);

    updatePlayers = () => this.getPage(0);

    getNextPage = () => this.getPage(this.state.page + 1);

    componentDidMount = () => this.props.user ? this.updatePlayers() : this.props.logout();

    render = () => <InfiniteLadder
        user={this.props.user}
        players={this.state.players}
        updatePlayers={this.updatePlayers}
        onNextPage={this.getNextPage}
        onError={this.props.onError}
    />;
}

class PlayerRow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            edit: false
        };
    }

    render() {
        return (<div className="player-row">
            <div className="row-bar" >
                <Button icon={this.state.edit ? "icono-cross" : "icono-sliders"}
                    onClick={() => this.props.user === this.props._id ? null :
                        this.setState(s => ({ edit: !s.edit }))}
                />
                <div className="player-info">
                    <h2>{this.props.position}</h2>
                    <h3>{this.props.firstname} {this.props.lastname}</h3>
                    <div className="stats">Wins: {this.props.wins}</div>
                    <div className="stats">Losses: {this.props.losses}</div>
                </div>
                <Button
                    icon="icono-mail"
                    onClick={() => window.open("mailto:" + this.props._id)}
                />
            </div>
            {!this.state.edit ? null :
                <NewGameForm
                    user={this.props.user}
                    opponent={this.props._id}
                    opponentName={this.props.firstname}
                    onSubmit={() => this.setState({ edit: false }, this.props.updatePlayers)}
                    onError={this.props.onError}
                />}
        </div>);
    }
}

export default LadderView;