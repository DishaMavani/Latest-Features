function bindCartNoteEvents() {
    console.log('Binding .add_note events...');
    $('.add_note').off('click').on('click', function () {
        const dataLineitem = $(this).attr('data-lineitem');
        const dataLineQty = $(this).attr('data-lineitem-qty');
        const dataLineProperty = $(this).attr('data-property');
        $('.mini-cart__action.show_line_cart_note').attr('open', true);
        $('#Cart-line-note').val(dataLineProperty || '');
        $('.show_line_cart_note_btn').off('click').on('click', function () {
            $('.mini-cart__action.show_line_cart_note').attr('open', false);
            const valText = $('#Cart-line-note').val();
            fetch('/cart.js')
            .then(res => res.json())
            .then(cart => {
                const lineItem = cart.items.find(item => item.key === dataLineitem);
                if (!lineItem) {
                    console.error('Line item not found');
                    return  ;
                }
                const updatedProperties = { ...(lineItem.properties || {}) };
                updatedProperties["Note"] = valText;

                return fetch('/cart/change.js', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: dataLineitem,
                        quantity: lineItem.quantity,
                        properties: updatedProperties
                    })
                });
            })
            .then(res => res && res.json())
            .then(cart => {
                import('@theme/events').then(({ CartUpdateEvent }) => {
                    const cartDrawer = document.querySelector('cart-drawer-component');    
                    fetch('/cart.js')
                    .then(res => res.json())
                    .then(cart => {
                        const event = new CartUpdateEvent(cart, 'manual-trigger', {
                            itemCount: cart.item_count,
                            source: 'fad-refresh',
                            sections: {}
                        });
                        document.dispatchEvent(event);
                        if (cartDrawer?.hasAttribute('auto-open')) {
                            cartDrawer.open();
                        }
                        bindCartNoteEvents();
                    });
                });


                // $('.show_line_cart_note summary').trigger('click');
                // if (window.location.href.indexOf("/cart") > -1) {
                // fetch(`{{ routes.root_url }}?section_id=main-cart-items`)
                //     .then(res => res.text())
                //     .then(html => {
                //     const $html = $(html);
                //     const $specificElement = $html.find('#cart');
                //     $('#cart').html($specificElement);
                //     bindCartNoteEvents();
                //     });
                // }else{
                // fetch(`{{ routes.root_url }}?section_id=mini-cart`)
                //     .then(res => res.text())
                //     .then(html => {
                //     document.getElementById('mini-cart').innerHTML = html;
                //     bindCartNoteEvents();
                //     });
                // }
            })
            .catch(err => {
                console.error('Failed to update cart:', err);
            });
        });
    });
}

function watchMiniCartChanges() {
    const targetNode = document.querySelector('.cart-drawer__inner') || document.querySelector('#cart-form');
    if (!targetNode) {
        setTimeout(watchMiniCartChanges, 300); 
        return;
    }
    bindCartNoteEvents();
    const observer = new MutationObserver(() => {
        bindCartNoteEvents();
    });
    observer.observe(targetNode, { childList: true, subtree: true });
}

watchMiniCartChanges();