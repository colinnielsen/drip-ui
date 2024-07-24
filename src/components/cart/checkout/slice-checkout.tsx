// export const PayButton = () => {
//   const wallet = useConnectedWallet();

//   const { data: cart, error } = useCartInSliceFormat({
//     buyerAddress: wallet?.address,
//   });
//   if (!cart || !wallet) return null;

//   const purchase = async () =>
//     sliceKit.payProducts({
//       account: wallet.address,
//       cart,
//     });

//   return (
//     <button onClick={purchase} className={btnClass}>
//       <Mono className="text-white uppercase">Checkout</Mono>
//     </button>
//   );
// };

export const SliceCheckoutButton = () => {
  // const step = useDetermineCheckoutStep();

  return (
    <>
      {/* <div
        className={cn(
          'bg-secondary-pop h-14 w-full flex flex-col justify-center rounded-[50px]',
          {
            'animate-pulse':
              step.step === 'initializing' || step.button === null,
          },
        )}
      >
        {step.button}
      </div>
      {step.step} */}
    </>
  );
};
