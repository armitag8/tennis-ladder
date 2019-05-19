import React, { Component } from 'react';
import '../style/LadderView.css';
import NewGameForm from "./NewGameForm";
import Button from './Button';

class LadderView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            games: []
        };
    }
    componentDidMount = () => this.props.user ? this.getGames() : this.props.logout();

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState, this.validate);
    }

    getGames = () => 
        fetch("/api/games/scheduled/" + this.props.user)
        .then(response => {
            if (response.status === 200)
                response.json().then(games => this.setState({ games: games }, console.log(games)));
            else if (response.status === 401) 
                this.props.logout();
            else 
                console.log(response);
        })
        .catch(console.log);

    render() {
        return (
            <div>
                <section>
                    <h2>Upcoming Games</h2>
                    {this.state.games.map(game => <div>
                        <div>    
                            Week: {game.week}
                        </div>
                        <div>
                            Opponent: {game.player1 === this.props.user ?
                                game.player2 : game.player1}
                        </div>
                    </div>)}
                </section>
            </div>);/*
                <section>
                    <h2>Add Game</h2>
                    <NewGameForm opponentName="Joe"/>
                </section>
                <section>
                    <h2>Past Games</h2>
                    <form className="game-search">
                        <input type="search" />
                        <Button icon="icono-search"/>
                    </form>
                    {this.state.games.map(game => 
                        <GameRecord 
                            key={game._id} 
                            _id={game._id}
                            player1={game.player1}
                            player2={game.player2}
                            score={game.score}
                        />)}
                </section>
            </div>
        );*/
    }
}

class GameRecord extends Component {
    render() {
        return (<div/>);
    }
}

export default LadderView;