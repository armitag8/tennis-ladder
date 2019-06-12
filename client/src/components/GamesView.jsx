import React, { Component } from 'react';
import '../style/GamesView.css';
import PlayerRow from "./PlayerRow";
import PlayerLookupBox from './PlayerLookupBox';
import Button from "./Button";

class GamesView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            scheduledGames: [],
            pastGames: [],
            search: ""
        };
    }
    componentDidMount = () => this.props.user ? this.reload() : this.props.logout();

    reload = () => this.getGames("scheduled") && this.getGames("past");

    onUpdate = event => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState);
    }

    filterPastGames = e => {e.preventDefault(); this.getGames("past", this.state.search)};

    getGames = (which, who="") =>
        fetch(`/api/games/${which}/${this.props.user}/${who}`)
            .then(response => {
                if (response.status === 200)
                    response.json().then(games => this.setState(() => {
                        let newState = {};
                        newState[`${which}Games`] = games;
                        return newState;
                    }));
                else if (response.status === 401)
                    this.props.logout();
                else
                   response.text().then(message => this.props.onError(new Error(message)));
            })
            .catch(err => this.props.onError(new Error(err)));

    render() {
        let unconfirmedGames = this.state.pastGames.filter(g => ! g.confirmed);
        return (
            <div className="games">
            <section>
                    <h2>Upcoming Matches</h2>
                    {this.state.scheduledGames.map(player =>
                        <PlayerRow
                            user={this.props.user}
                            key={player._id}
                            _id={player._id}
                            position={player.position}
                            firstname={player.firstname}
                            lastname={player.lastname}
                            wins={player.wins}
                            losses={player.losses}
                            player1={player.player1}
                            player2={player.player2}
                            score={player.score}
                            updatePlayers={this.reload}
                            onError={this.props.onError}
                        />)}
                    {this.state.scheduledGames.length !== 0 ? null : 
                        <span>
                            No matches scheduled. Wait until next week, or challenge someone.
                        </span>
                    }
                </section>
                {unconfirmedGames.length === 0 ? null : <section>
                    <h2>Unconfirmed Matches</h2>
                    <div className="past-games">
                        <div className="past-games-column-headers">
                            <div className="week">Confirm</div>
                            <div className="opponent">Opponent</div>
                            <div className="result">Result</div>
                            <div className="score">Score</div>
                        </div>
                        {unconfirmedGames.map(game =>
                            <GameRecord
                                key={game._id}
                                onAck={() => this.getGames("past")}
                                onError={this.props.onError}
                                game={game}
                            />)}
                    </div>
                </section>}
                <section>
                    <h2>Past Matches</h2>
                    <form className="game-search" onSubmit={this.filterPastGames}>
                        <div className="search-box">
                            <PlayerLookupBox 
                                inputClass="search-bar"
                                player={this.state.player}
                                onUpdate={this.onUpdate}
                                name="search"
                                onError={this.props.onError}
                            />
                        </div>
                        <Button icon="icono-search" onClick={this.filterPastGames}/>
                    </form>
                    <div className="past-games">
                        <div className="past-games-column-headers">
                            <div className="week">Week</div>
                            <div className="opponent">Opponent</div>
                            <div className="result">Result</div>
                            <div className="score">Score</div>
                        </div>
                        {this.state.pastGames.filter(g => g.confirmed).map(game =>
                            <GameRecord
                                key={game._id}
                                game={game}
                            />)}
                    </div>
                </section>
            </div>
        );
    }
}

class GameRecord extends Component {
    confirm = () => fetch(`/api/games/${this.props.game._id}/confirmation`, {method: "PUT"})

    reject = () => fetch(`/api/games/${this.props.game._id}`, {method: "DELETE"});

    handleAck = promise => promise
        .then(response => response.ok ? this.props.onAck() : this.props.onError)
        .catch(err => this.props.onError(err));

    render() {
        let game = this.props.game;
        return <div className="game-record">
            <div className="week">
                {game.confirmed ? game.week.toString() : <React.Fragment>
                    <button className="tiny-button" onClick={() => this.handleAck(this.confirm())}>
                        <div className="icono-check"/>
                        </button>
                    <button className="tiny-button" onClick={() => this.handleAck(this.reject())}>
                        <div className="icono-cross"/>
                    </button>
                </React.Fragment>}
            </div>
            <div className="opponent">
                {game.opponent.firstname + " " + game.opponent.lastname}
            </div>
            <div className="result">
                {game.win ? "Win" : "Loss"}
            </div>
            <div className="score">
                {game.score.slice(0, 2).join("-")}
                {game.score.length < 3 ? null : 
                    `, ${game.score.slice(2).join("-")}`}
            </div>
        </div>;
    }
}

export default GamesView;