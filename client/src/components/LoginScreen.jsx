import React, {Component} from 'react';
import '../style/LoginScreen.css';
import validator from 'validator';

const OWNER = "UTSC";
const User = (function () {
    return function (user) {
        this._id = user._id;
        this.password = user.password;
        this.firstname = user.firstname;
        this.lastname = user.lastname;
        this.position = 0;
        this.wins = 0;
        this.losses = 0;
    }
})();

class LoginScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            mode: "Sign In",
            _id: "",
            password: "",
            password2: "",
            firstname: "",
            lastname: "",
            valid: false,
            error: Error("Please input your credentials")
        };
    }

    validate = () => {
        let s = this.state;
        if (! validator.isEmail(s._id))
            this.handleError(Error("Username must be a valid email address."));
        else if (s.password.length < 5) 
            this.handleError(Error("Password must have at least 5 characters"));
        else if (s.mode === 'Sign Up' && s.password !== s.password2)
            this.handleError(Error("Passwords must match"));
        else if (s.mode === "Sign Up" && s.firstname.length < 1)
            this.handleError(Error("Your first name must be provided"));
        else if (s.mode === "Sign Up" && ! validator.isAlpha(s.firstname))
            this.handleError(Error("First name may only contain alphabetic characters"));
        else if (s.mode === "Sign Up" && ! validator.isAlpha(s.lastname))
            this.handleError(Error("Last name may only contain alphabetic characters"));
        else
            this.setState({ valid: true });
    }

    handleError = (err) => {
        this.setState({
            valid: false,
            error: err
        });
    }

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState, this.validate);
    }

    onSubmit = (event) => {
        event.preventDefault();
        if (this.state.valid) {
            fetch(new Request('/api/user/' + this.state._id, {
                method: this.state.mode === 'Sign Up' ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(new User(this.state))
            }))
            .then(response => {
                if (response.ok) this.props.onAuthenticate(this.state._id);
                else response.text().then(msg => this.handleError(new Error(msg)));
            }).catch(err => this.handleError(new Error(err)));
        }
    };
    
    render() {
        return (
            <div className="login has-text-centered">
                <h2>Welcome to {OWNER}'s Tennis Ladder</h2>
                <form className="login-form">
                    {this.state.valid 
                        ? null 
                        : <output className="has-text-grey is-size-7">{this.state.error.message}</output>}
                    <div className="inputFields">
                        <input 
                            type="email"
                            className="field input"
                            autoComplete="username"
                            placeholder="Email Address" 
                            name="_id" 
                            onChange={this.onUpdate}/>
                        <input 
                            className="field input"
                            autoComplete={this.state.mode === "Sign In" ? 
                                            "current-password" : "new-password"}
                            type="password" 
                            placeholder="Password" 
                            name="password" 
                            onChange={this.onUpdate}/>
                        {this.state.mode === "Sign In" ? null :
                            <React.Fragment>
                                <input 
                                    className="field input" 
                                    type="password" 
                                    autoComplete="new-password"
                                    placeholder="Retype Password" 
                                    name="password2" 
                                    onChange={this.onUpdate}/>
                                <input 
                                    className="field input" 
                                    autoComplete="given-name"
                                    placeholder="First Name" 
                                    name="firstname" 
                                    onChange={this.onUpdate}/>
                                <input 
                                    className="field input" 
                                    autoComplete="family-name"
                                    placeholder="Last Name" 
                                    name="lastname" 
                                    onChange={this.onUpdate}/>
                            </React.Fragment>
                        }
                    </div>
                    <input 
                        className="loginBtn"
                        type="button" 
                        value={this.state.mode} 
                        onClick={this.onSubmit}
                        disabled={!this.state.valid}
                    />
                    <label className="has-text-centered">{this.state.mode === "Sign In" ? "Need" : "Have"} an account?
                    <input 
                        className="mode"
                        type="button" 
                        name="mode"
                        value={this.state.mode === "Sign In" ? "Sign Up" : "Sign In"}
                        onClick={this.onUpdate} 
                    />
                    </label>
                </form>
            </div>
        );
    }
}

export default LoginScreen;