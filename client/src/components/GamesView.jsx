import React, { Component } from 'react';
import '../style/LadderView.css';
import NewGameForm from "./NewGameForm";

class LadderView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            games: []
        };
    }

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState, this.validate);
    }

    updateGames = () => 
        fetch("/api/games/")
        .then(response => {
            if (response.status === 200)
                response.json().then(games => this.setState({ games: games }));
            else if (response.status === 401) 
                this.props.onLogout();
            else 
                console.log(response);
        })
        .catch(console.log);

    componentDidMount = () => this.updateGames();

    render() {
        return (
            <div>
                <NewGameForm opponentName="Joe"/>
                {this.state.games.map(game => 
                    <GameRecord 
                        key={game._id} 
                        _id={game._id}
                        player1={game.player1}
                        player2={game.player2}
                        score={game.score}
                    />)}
            </div>);
    }
}

class GameRecord extends Component {
    render() {
        return (<div/>);
    }
}

export default LadderView;