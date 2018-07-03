import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import EmbarkJS from 'Embark/EmbarkJS';
import web3 from "Embark/web3"
import { Button, FormControl, InputGroup } from 'react-bootstrap';
import SpaceshipToken from 'Embark/contracts/SpaceshipToken';
import SpaceshipMarketplace from 'Embark/contracts/SpaceshipMarketplace';
import Spinner from 'react-spinkit';
import MarketPlace from './marketplace';


class Ship extends Component {

    constructor(props){
        super(props);
        this.state = {
            image: '',
            isSubmitting: false,
            showSellForm: false,
            sellPrice: ''
        }
    }
    
    handleChange(fieldName, value) {
        this.state[fieldName] = value;
        this.setState(this.state);
    }

    componentDidMount(){
        EmbarkJS.onReady((err) => {
          this._loadAttributes();
        });
    }

    _loadAttributes(){
        // Cargar los atributos involucra leer la metadata
        EmbarkJS.Storage.get(web3.utils.toAscii(this.props.metadataHash))
            .then(content => {
                const jsonMetadata = JSON.parse(content);

                // Podemos usar este metodo
                const _url = EmbarkJS.Storage.getUrl(jsonMetadata.imageHash);

                // o leer el url que grabamos en la metadata
                // const _url = jsonMetadata.image

                this.setState({image: _url})
            });
    }

    showSellForm = (show) => {
        this.setState({'showSellForm': show});
    }

    sellShip = () => {
        const { forSale } = SpaceshipMarketplace.methods;
        const { sellPrice } = this.state;
        const { id } = this.props;

        this.setState({isSubmitting: true});

        const toSend = forSale(id, web3.utils.toWei(sellPrice, 'ether'))

        toSend.estimateGas()
            .then(estimatedGas => {
                return toSend.send({from: web3.eth.defaultAccount,
                                    gas: estimatedGas + 1000});
            })
            .then(receipt => {
                console.log(receipt);
                
                this.props.onAction();

                // TODO: show success
                return true;
            })
            .catch((err) => {
                console.error(err);
                // TODO: show error blockchain
            })
            .finally(() => {
                this.setState({isSubmitting: false});
            });
    }

    buyFromStore = () => {
        const { buySpaceship } = SpaceshipToken.methods;
        const toSend = buySpaceship(this.props.id)

        this.setState({isSubmitting: true});

        toSend.estimateGas({value: this.props.price })
            .then(estimatedGas => {
                return toSend.send({from: web3.eth.defaultAccount,
                                    value: this.props.price,
                                    gas: estimatedGas + 1000000});
            })
            .then(receipt => {
                console.log(receipt);

                console.log("Updating ships");
                this.props.onAction();

                // TODO: show success
                return true;
            })
            .catch((err) => {
                console.error(err);
                // TODO: show error blockchain
            })
            .finally(() => {
                this.setState({isSubmitting: false});
            });
    }

    buyFromMarket = () => {
        const { buy } = SpaceshipMarketplace.methods;
        const toSend = buy(this.props.saleId);

        this.setState({isSubmitting: true});

        toSend.estimateGas({value: this.props.price })
            .then(estimatedGas => {
                return toSend.send({from: web3.eth.defaultAccount,
                                    value: this.props.price,
                                    gas: estimatedGas + 1000000});
            })
            .then(receipt => {
                console.log(receipt);
                
                this.props.onAction();

                // TODO: show success
                return true;
            })
            .catch((err) => {
                console.error(err);
                // TODO: show error blockchain
            })
            .finally(() => {
                this.setState({isSubmitting: false});
            });
    }

    render(){
        const { energy, lasers, shield, price, wallet, salesEnabled, marketplace } = this.props;
        const { image, isSubmitting, showSellForm } = this.state;
        
        const formattedPrice = !wallet ? web3.utils.fromWei(price, "ether") : '';

        return <div className="ship">
            { !wallet ? <span className="price">{formattedPrice} Ξ</span> : ''}
            <img src={image} />
            <br />
            <ul>
                <li title="Energia"><i className="fa fa-dashboard" aria-hidden="true"></i> {energy}</li>
                <li title="Lasers"><i className="fa fa-crosshairs" aria-hidden="true"></i> {lasers}</li>
                <li title="Escudo"><i className="fa fa-shield" aria-hidden="true"></i> {shield}</li>
            </ul>
            { !wallet || marketplace
                ? <Button disabled={isSubmitting} bsStyle="success" onClick={marketplace ? this.buyFromMarket : this.buyFromStore}>Comprar</Button> 
                : (!showSellForm && salesEnabled
                    ? <Button bsStyle="success" className="hiddenOnLeave" onClick={e => { this.showSellForm(true) }}>Vender</Button>
                    : '')
             }

            { showSellForm
                ? <Fragment>
                    <InputGroup>
                        <FormControl
                            type="text"
                            value={this.state.sellPrice}
                            onChange={(e) => this.handleChange('sellPrice', e.target.value)} />
                            <InputGroup.Addon>Ξ</InputGroup.Addon>
                    </InputGroup>
                    <Button disabled={isSubmitting} bsStyle="success" onClick={this.sellShip}>Vender</Button>
                    <Button disabled={isSubmitting} onClick={e => { this.showSellForm(false) }}>Cancelar</Button>
                </Fragment> : ''
            }

             { isSubmitting ? <Spinner name="ball-pulse-sync" color="green"/> : '' }
            </div>;
    }
}

export default Ship;
