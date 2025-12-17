import styled from "styled-components";

export const ContentWrapper = styled("div")`
  display: flex;
  height: 100%;
  gap: 8px;
  width: 100%;

  .container {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;

    .row-top {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: auto;
    }
    .row-bottom {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding-top: 16px;
      border-radius: 8px;
    }
  }
`;