
const checkIsIncluded = (ar1, ar2) => {
  let dict1 = {};
  let dict2 = {};
  let isFirst = true;
  let isSecond = true;

  ar1.forEach(el => {
    dict1[el] = true;
  })

  ar2.forEach(el=> {
    dict2[el] = true;
    isFirst = !isFirst ? false : dict1[el]
  };

  ar1.forEach(el=> {
   isSecond = !isSecond ? false : dict2[el]
  };

  return isFirst && isSecond;
}
