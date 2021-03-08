import React,{ useState, useEffect } from "react";
import { Button, Label, Segment, Table, Loader } from 'semantic-ui-react';
import NLC from '../abis/NLC.json';
import Web3 from 'web3';

function Main(){

  const mintAdmin = "0xA84D9ea736B6f48705EfE68689baE72F86897A41";  //ropsten test net
  const swapAdmin = "0x55A294336666eD7572C8De527Fc2ED1F46b30edf";  //ropsten test net

  // const mintAdmin = "0x8A0351e2f224ba672d848cCd39ac93Fe4264D3Eb";  //local
  // const swapAdmin = "0x757e4F76AC7E7173996A0dD41506e4EE111B9dBD";  //local

  const [account, setAccount] = useState("");
  const [nlc, setNLC] = useState({});
  const [supply, setSupply] = useState();
  const [loading,setLoading] = useState(false);
  const [minted,setMinted] = useState(false);
  let mintAmount = 0;
  let multiTransfer = [];
  
  const [dummyData,setDummyData] = useState([{id:"0x50e5b7ab2E22e51C6E465cF27803BeBE1432c7d2",amount:2467,tx:"0xsgegtdbetdbetdgdtdtte"},
                   {id:"0xe35f331F4C36B01810b1D42dfA715Eb1A74940e8",amount:345,tx:"0xsgegtdbetdbvahvahajsh"},
                   {id:"0xD5082813CA44F9Bc2e2DE312Da9FB18dAbab895f",amount:12670,tx:"0xsgegtdbetsbdjsbcsdc"},
                   {id:"0x9EF47470C2168c039211Adaf32c4b7E3fbc4Ea22",amount:4574374,tx:"0xsgegtdbetbcsdjbcdsj"},
                   {id:"0x4513547A5CFF327C42a6D77559F89c4D70bd661B",amount:32535,tx:"0xsckjscdbetdckjckdsdsk"},
                  ]);

  async function loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

  async function loadBlockchainData(){
    const web3 = window.web3;
    if(typeof (web3) != 'undefined' && web3 != null){ 
        web3.eth.getAccounts()
        .then(res=>{
            setAccount(res[0]);
        })
        .catch(err=>{
            window.alert("please select your ethereum account");
        }) 
    }

    const networkId = await web3.eth.net.getId();

        const nlcData = NLC.networks[networkId];
            
            if(nlcData) {
                const nlcd = new web3.eth.Contract(NLC.abi, nlcData.address);
                setNLC(nlcd);
                
                const totalSupply = await nlcd.methods.totalSupply().call();
                let amount = totalSupply/100000000;
                setSupply(amount);

            } else {
                window.alert('NLC contract not deployed to detected network.');
            }  
           
  }    
  
  useEffect(() => {
    loadWeb3();  
    loadBlockchainData();
  },[])

  function mintSupply(){

    if(mintAdmin === account){
      setLoading(true);

      //To mint 1 NLC token, multiply amount with 10^8 

      const NLCAmount = mintAmount*100000000;  
      nlc.methods.mintSupplyToSwapAdmin(NLCAmount).send({from:account})
      .once('confirmation', (confirmation) => {
        setLoading(false);
        setMinted(true);
        window.alert("transaction successful.");
      })
      .on('error', (error) => {
          window.alert("Transaction failed. Try again!");
          setLoading(false);
      });
    }else{
      window.alert("Please switch to the mint admin's account");
    }  
  }

  function sendTokens(event){
    const indexed = event.target.value;
    if(swapAdmin === account){
      setLoading(true);

      //To send 1 NLC token, multiply amount with 10^8 

      const NLCAmount = dummyData[indexed].amount*100000000;  
      nlc.methods.transfer(dummyData[indexed].id,NLCAmount).send({from:account})
      .once('confirmation', (confirmation) => {
        setLoading(false);
        window.alert("transaction successful.");

        setDummyData(prevData => {
          return prevData.filter((items, index) => {
            return items.tx !== dummyData[indexed].tx;
          });
        });

      })
      .on('error', (error) => {
          window.alert("Transaction failed. Try again!");
          setLoading(false);
      });
    }else{
      window.alert("Please switch to the swap admin's account");
    }  
  }

  function sendTokensAll(){
    
    if(swapAdmin === account){
      setLoading(true);

      //Maximum 10 transfers are permissible at a time

      if(multiTransfer.length <= 10){
        nlc.methods.transferToMultipleAccounts(multiTransfer).send({from:account})
        .once('confirmation', (confirmation) => {
          setLoading(false);
          window.alert("transaction successful.");

          setDummyData([]);

        })
        .on('error', (error) => {
            window.alert("Transaction failed. Try again!");
            setLoading(false);
        });
      }  
    }else{
      window.alert("Please switch to the swap admin's account");
    }  
  }

  return(
    <div className="main">
        
      <Segment className="wrap">
        <Label><h1>{account}</h1></Label>
        <h2><b>Total NLC Supply : </b> {supply} </h2>
        <p><b>Mint Admin Address :</b> {mintAdmin} </p>
        <p><b>Swap Admin Address :</b> {swapAdmin} </p>
      </Segment>

      <Segment>
        
        {loading?<Loader active inline='centered' />:(dummyData.length!==0)?
        <>
        {(!minted)&&(mintAdmin===account)&& 
        <Button onClick={mintSupply} color="red" size="large" fluid>Mint All at Once</Button>
        }
        <Table celled size="large">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>User ID(Address)</Table.HeaderCell>
              <Table.HeaderCell>Swap Amount</Table.HeaderCell>
              <Table.HeaderCell>Transaction ID</Table.HeaderCell>
              <Table.HeaderCell>
                <Button onClick={sendTokensAll} color="black" size="large" >Send All</Button>
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {dummyData.map((item, index) => {
              mintAmount += item.amount;
              let swapAmount = item.amount*100000000; 
              multiTransfer.push({recipient:item.id,amount:swapAmount});
              return (
                <Table.Row key={index}>
                  <Table.Cell>{item.id}</Table.Cell>
                  <Table.Cell>{item.amount}</Table.Cell>
                  <Table.Cell>{item.tx}</Table.Cell>
                  <Table.Cell>
                    <Button onClick={sendTokens} value={index}
                      color="grey" size="small" 
                    >Send</Button>
                  </Table.Cell>
                </Table.Row>
              );
            })}    
          </Table.Body>
        </Table>
        </>
        :<p>No Records Found</p>
        }
      </Segment>
    </div>
  );
}

export default Main;
