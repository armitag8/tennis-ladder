import React, { Component } from 'react';
import Button from "./Button";
import "../style/NewGameForm.css"
import validator from "validator";

class Game {
    constructor(player1, player2, score) {
        if (undefined === player1 || !validator.isEmail(player1))
            throw Error("Not a valid email address1");
        else if (undefined === player2 || !validator.isEmail(player2))
            throw Error("Not a valid email address2");
        else if (undefined === score || !this.isValidScore(score))
            throw Error("Not a valid score");
        this.player1 = player1;
        this.player2 = player2;
        this.score = score;
    }

    isValidScore = score => {
        let s0 = score[0];
        let s1 = score[1];
        let s2 = score[2];
        let s3 = score[3];
        if (s0 === 8 && s1 <= 6 && s1 >= 0)
            return true;
        else if (s1 === 8 && s0 <= 6 && s0 >= 0)
            return true;
        else if (s0 === 9 && s1 === 7)
            return true;
        else if (s1 === 9 && s0 === 7)
            return true;
        else if (s0 === 8 && s1 === 8 && s2 - s3 >= 2 && s2 > 9 && s3 > 0)
            return true;
        else if (s0 === 8 && s1 === 8 && s3 - s2 >= 2 && s3 > 9 && s2 > 0)
            return true;
        else
            return false;
    }
}

class NewGameForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            score: ["", ""],
            loading: false
        };
    }

    alterScore = (index, value) => {
        if (value === null || value === undefined || value < 0 || index < 0 || index > 3 ||
            (value > 9 && index < 2)) return;
        this.setState(oldState => {
            let score = oldState.score;
            score[index] = Number.isInteger(value) ? value : "";
            if (score.length === 2 && score[0] === 8 && score[1] === 8) score = [8, 8, "", ""];
            if (score.length === 4 && (score[0] !== 8 || score[1] !== 8)) score = score.slice(0, 2);
            return { score: score };
        });
    };

    submitForm = e => {
        e.preventDefault();
        this.setState({ loading: true }, () => {
            try {
                let game = new Game(this.props.user, this.props.opponent, this.state.score);
                fetch("/api/games/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(game)
                }).then(response => response.ok ?
                    this.setState({ loading: false }, this.props.onSubmit) :
                    response.text().then(err => this.props.onError(new Error(err)))
                ).catch(err => this.props.onError(new Error(err)));
            } catch (e) {
                this.props.onError(e);
            }
        });
    };

    render() {
        return (
            <form className="game-form">
                <div className="scores-box">
                    <div className="score-box">
                        <label>Proset Score:</label>
                        <ScoreBox
                            max="9"
                            score={this.state.score[0]}
                            index="0"
                            alterScore={this.alterScore}
                            owner="Your"
                        />

                        <label>-</label>
                        <ScoreBox
                            max="9"
                            score={this.state.score[1]}
                            index="1"
                            alterScore={this.alterScore}
                            owner={`${this.props.opponentName}'s`}
                        />
                    </div>
                    {this.state.score.length !== 4 ? null :
                        <div className="score-box">
                            <label>Tiebreak Score:</label>
                            <ScoreBox
                                max="20"
                                score={this.state.score[2]}
                                index="2"
                                alterScore={this.alterScore}
                                owner="Your Tiebreak"
                            />
                            <label>-</label>
                            <ScoreBox
                                max="20"
                                score={this.state.score[3]}
                                index="3"
                                alterScore={this.alterScore}
                                owner={`${this.props.opponentName}'s Tiebreak`}
                            />
                        </div>}
                </div>
                <Button
                    loading={this.state.loading}
                    icon="icono-check"
                    onClick={this.submitForm} />
            </form>);
    }
}

class ScoreBox extends Component {
    render() {
        return (
            <React.Fragment>
                <input
                    className="field"
                    type="number"
                    min="0"
                    max={this.props.max}
                    value={this.props.score}
                    list={"datalist" + this.props.index}
                    placeholder={`${this.props.owner} Score`}
                    onChange={e => this.props.alterScore(this.props.index,
                        Number.parseInt(e.target.value))} />
                <datalist id={"datalist" + this.props.index} type="number">
                    {[...Array(Number.parseInt(this.props.max) + 1).keys()].map(n =>
                        <option key={n} value={n} />)}
                </datalist>
            </React.Fragment>
        );
    }
}

export default NewGameForm;