import React, { Component } from 'react';
import "../style/ProfileView.css"
import Button from './Button';
import validator from "validator";

class ProfileView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            deleteConfirmation: "",
            password: "",
            password2: "",
            firstname: "",
            lastname: "",
            valid: false,
            error: Error("")
        };
    }
    componentDidMount = () => this.props.user ? null : this.props.logout();

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState, this.validate);
    };

    handleError = (err) => {
        this.setState({
            valid: false,
            error: err
        });
    };
    

    validate = () => {
        let s = this.state;
        if (s.password && s.password.length < 5) 
            this.handleError(Error("Password must have at least 5 characters"));
        else if (s.password !== s.password2)
            this.handleError(Error("Passwords must match"));
        else if (s.firstname && s.firstname.length < 1)
            this.handleError(Error("Your first name must be provided"));
        else if (s.firstname && ! validator.isAlpha(s.firstname))
            this.handleError(Error("First name may only contain alphabetic characters"));
        else if (s.lastname && ! validator.isAlpha(s.lastname))
            this.handleError(Error("Last name may only contain alphabetic characters"));
        else
            this.setState({ valid: true });
    };

    updateProfile = () => fetch(`/api/user/${this.props.user}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            firstname: this.state.firstname,
            lastname: this.state.lastname,
            password: this.state.password
        })
    }).then(response => response.status === 200 ? null :
        response.text().then(err => this.props.onError(new Error(err))
        )).catch(this.props.onError);

    deleteProfile = () => this.state.deleteConfirmation.toLowerCase().includes("yes") ?
        fetch(`/api/user/${this.props.user}`, { method: "DELETE" })
            .then(response => response.status === 204 ? this.props.logout() :
                response.text().then(err => this.props.onError(new Error(err))
                )).catch(this.props.onError) :
        this.props.onError(new Error("Type 'Yes' to confirm."));

    render() {
        return (
            <div className="view">
                <form onSubmit={e => e.preventDefault()}>
                    <h2>
                        Delete your profile
                    </h2>
                    <label>Your ranking will be lost.</label>
                    <div className="submit-box">
                        <input
                            className="field"
                            value={this.state.deleteConfirmation}
                            name="deleteConfirmation"
                            placeholder="Confirm with 'Yes'"
                            onChange={this.onUpdate}
                        />
                        <Button icon="icono-trash" onClick={this.deleteProfile} />
                    </div>
                </form>
                <form onSubmit={e => { e.preventDefault() }}>
                    <h2>
                        Edit your profile
                    </h2>
                    {this.state.valid ? null : <output>{this.state.error.message}</output>}
                    <div className="submit-box">
                        <div className="fields-box">
                            <input
                                className="field"
                                autoComplete="given-name"
                                placeholder="First Name"
                                name="firstname"
                                onChange={this.onUpdate}
                            />
                            <input
                                className="field"
                                autoComplete="family-name"
                                placeholder="Last Name"
                                name="lastname"
                                onChange={this.onUpdate}
                            />
                            <input 
                                className="field"
                                autoComplete="new-password"
                                type="password" 
                                placeholder="Password" 
                                name="password"
                                value={this.state.password}
                                onChange={this.onUpdate}
                            />
                            <input 
                                className="field" 
                                type="password" 
                                autoComplete="new-password"
                                placeholder="Retype Password" 
                                name="password2" 
                                value={this.state.password2}
                                onChange={this.onUpdate}
                            />
                        </div>
                        <Button icon="icono-check" onClick={this.updateProfile} />
                    </div>
                </form>
            </div>
        );
    }
}

export default ProfileView;