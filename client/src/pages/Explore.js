import React, { useEffect, useMemo, useRef, useState } from "react";
import CardSkeleton from "../components/skeletons/CardSkeleton";
import { useSelector } from "react-redux";
import styled, { css } from "styled-components";
import Card from "../components/common/Card";
import abi from "../lib/abis/explore_ABI.json";
import axios from "axios";
import { CONTRACT_ADDRESS } from "../lib/contractAddress";

const Container = styled.section`
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};

  .heading-wrapper {
    padding: 50px 0;
  }

  .heading {
    font-size: 40px;
    text-align: center;
    font-weight: 600;
  }

  .contents {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .tab-menu {
    display: flex;
    justify-content: center;
    height: 50px;
    border-bottom: 1px solid #e5e8eb;
  }

  .tab-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .tab-text {
    font-weight: 500;
    text-align: center;
    font-size: 16px;
  }

  .tab-underline {
    width: 112px;
    height: 4px;
    border-radius: 2px;
    background-color: #2081e2;
  }

  .contents {
    display: grid;
    grid-template-columns: 1fr;
    padding: 40px;
    padding-bottom: 300px;
    justify-items: center;
    gap: 20px;
  }

  .loading {
    width: 100%;
    height: 600px;
    background-color: gray;
  }

  .observer {
    width: 100%;
    height: 1px;
    display: ${({ showObserver }) => (showObserver ? "default" : "none")};
  }

  @media screen and (min-width: 720px) {
    .contents {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  ${({ theme }) =>
    theme.mode === "dark" &&
    css`
      .tab-menu {
        border-bottom: 1px solid #151b22;
      }
    `}
`;

const Explore = () => {
  const [loading, setLoading] = useState(false);
  const [showObserver, setShowObserver] = useState(true);
  const [marketArray, setMarketArray] = useState([]);
  const [loadedArray, setLoadedArray] = useState([]);

  const web3 = useSelector((state) => state.web3.web3);

  // ????????? ??????
  useEffect(() => {
    if (!web3) return;
    const contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);

    const getMarketNFTs = async () => {
      setLoading(true);
      const nfts = await contract.methods.fetchMarketItems().call();

      const nftArray = await Promise.all(
        nfts.map(async (nft) => {
          const response = await axios.get(nft.tokenURI);
          const tokenMetadata = response.data;

          const nftObject = {
            tokenId: nft.tokenId,
            owner: nft.seller,
            name: tokenMetadata.name,
            description: tokenMetadata.description,
            imageUrl: tokenMetadata.image,
          };

          return nftObject;
        })
      );

      setLoading(false);
      setMarketArray(nftArray);
      setLoadedArray(nftArray.splice(0, 3));
    };
    getMarketNFTs();
  }, [web3]);

  const targetRef = useRef();

  // ???????????????
  const observer = useMemo(() => {
    return new IntersectionObserver((entries) => {
      if (!targetRef?.current) return;

      if (entries[0].isIntersecting) {
        setLoading(true);
        setShowObserver(false);

        const newArray = marketArray.splice(0, 3);

        if (newArray.length === 0) {
          setLoading(false);
          setShowObserver(true);
          observer.disconnect();
          return;
        }

        setLoadedArray((loadedArray) => [...loadedArray, ...newArray]);
        setLoading(false);
        setShowObserver(true);
      }
    });
  }, [marketArray]);

  useEffect(() => {
    if (!targetRef?.current) return;

    observer.observe(targetRef.current);

    return () => {
      observer.disconnect();
    };
  }, [observer]);

  return (
    <Container showObserver={showObserver}>
      <div className="header" />
      <div className="heading-wrapper">
        <h1 className="heading">Explore Collections</h1>
      </div>
      <div className="tab-menu">
        <div className="tab-wrapper">
          <span className="tab-text">All</span>
          <div className="tab-underline" />
        </div>
      </div>
      <div className="contents">
        {loadedArray.map((token, index) => (
          <Card
            key={index}
            name={token.name}
            description={token.description}
            author={token.owner}
            imageUrl={token.imageUrl}
          />
        ))}
        {loading &&
          Array(3)
            .fill(0)
            .map((_, index) => <CardSkeleton key={index} />)}
      </div>
      <div className="observer" ref={targetRef} />
    </Container>
  );
};

export default Explore;
