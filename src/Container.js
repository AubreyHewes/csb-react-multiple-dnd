import React, { PureComponent } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import CardWrapper from './CardWrapper';
import CardDragLayer from './CardDragLayer';
import Card from './Card';

const TOTAL_ITEMS = 50;

const getNodeClientBounds = node => {
  const el = node.nodeType === 1 ? node : node.parentElement;
  if (!el) {
    return null;
  }
  return el.getBoundingClientRect();
};

@DragDropContext(HTML5Backend)
export default class Container extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      selectedCards: [],
      selectedCardsIds: [],
      draggedCardsIds: [],
      insertIndex: -1,
      cards: [...Array(TOTAL_ITEMS).keys()].map(i => ({
        id: i + 1,
        order: i,
        url: 'https://picsum.photos/80/45?random&' + i,
      })),
    };

    this.onCardMove = this.onCardMove.bind(this);
    this.onCardDragStart = this.onCardDragStart.bind(this);
    this.onCardDragComplete = this.onCardDragComplete.bind(this);
    this.onCardSelectionChange = this.onCardSelectionChange.bind(this);
  }

  onCardDragStart(dragItem) {
    const cards = this.state.cards.slice();

    Array.from(this.container.childNodes).map((child, i) => {
      cards[i].bounds = getNodeClientBounds(child);
    });

    this.setState({
      cards,
      selectedCards: dragItem.cards,
      selectedCardsIds: dragItem.cards.map(c => c.id),
      draggedCardsIds: dragItem.cards.map(c => c.id),
      hoveredCardId: dragItem.draggedCard.id,
      activeCardId: dragItem.draggedCard.id,
    });
  }

  onCardMove(dragItem, hoverId, pointerOffset) {
    const dragId = dragItem.draggedCard.id;

    const cards = this.state.cards.slice();

    const dragIndex = cards.findIndex(el => el.id === dragId);
    const hoverIndex = cards.findIndex(el => el.id === hoverId);
    const dragCard = cards[dragIndex];
    const hoverCard = cards[hoverIndex];

    const midX = hoverCard.bounds.left + (hoverCard.bounds.right - hoverCard.bounds.left) / 2;
    const insertIndex = pointerOffset.x < midX ? hoverIndex : hoverIndex + 1;

    if (
      this.previousDragId === dragId &&
      this.previousHoverId === hoverId &&
      this.previousInsertIndex === insertIndex
    ) {
      return;
    }
    this.previousDragId = dragId;
    this.previousHoverId = hoverId;
    this.previousInsertIndex = insertIndex;

    this.setState({
      insertIndex,
      hoveredCardIndex: hoverIndex,
      hoveredCardId: hoverId,
    });
  }

  onCardDragComplete(dragItem) {
    const changes = {
      draggedCardsIds: [],
      insertIndex: -1,
      hoveredCardId: null,
      hoveredCardIndex: -1,
    };
    if (dragItem) {
      let cards = this.state.cards.slice();
      const draggedCards = dragItem.cards;
      const remainingCards = cards.filter(c => !draggedCards.find(dc => dc.id === c.id));
      let insertIndex = -1;
      if (this.state.insertIndex < cards.length) {
        let index = this.state.insertIndex;
        do {
          const cardIdAtInsertIndex = cards[index].id;
          insertIndex = remainingCards.findIndex(c => c.id === cardIdAtInsertIndex);
          index += 1;
        } while (insertIndex < 0 && index < cards.length);
      }
      if (insertIndex < 0) {
        insertIndex = remainingCards.length;
      }
      remainingCards.splice(insertIndex, 0, ...draggedCards);
      changes.cards = remainingCards;
    }
    this.setState(changes);
  }

  onCardSelectionChange(cardId, cmdKeyActive, shiftKeyActive) {
    let selectedCardsIds = [];
    let activeCardId;

    const cards = this.state.cards.slice();
    let previousSelectedCardsIds = this.state.selectedCardsIds.slice();
    let previousActiveCardId = this.state.activeCardId;

    if (cmdKeyActive) {
      if (previousSelectedCardsIds.indexOf(cardId) > -1 && cardId !== previousActiveCardId) {
        selectedCardsIds = previousSelectedCardsIds.filter(id => id !== cardId);
      } else {
        selectedCardsIds = [...previousSelectedCardsIds, cardId];
      }
    } else if (shiftKeyActive && cardId !== previousActiveCardId) {
      const activeCardIndex = cards.findIndex(c => c.id === previousActiveCardId);
      const cardIndex = cards.findIndex(c => c.id === cardId);
      const lowerIndex = Math.min(activeCardIndex, cardIndex);
      const upperIndex = Math.max(activeCardIndex, cardIndex);
      selectedCardsIds = cards.slice(lowerIndex, upperIndex + 1).map(c => c.id);
    } else {
      selectedCardsIds = [cardId];
      activeCardId = cardId;
    }

    const selectedCards = cards.filter(c => selectedCardsIds.includes(c.id));

    const changes = {
      selectedCards,
      selectedCardsIds,
    };
    if (activeCardId) {
      changes.activeCardId = activeCardId;
    }
    this.setState(changes);
  }

  render() {
    const {
      cards,
      draggedCardsIds,
      selectedCards,
      selectedCardsIds,
      activeCardId,
      hoveredCardId,
      hoveredCardIndex,
      insertIndex,
    } = this.state;

    return (
      <main>
        <CardDragLayer />
        <div
          className="container"
          ref={el => {
            this.container = el;
          }}
        >
          {cards.map((card, i) => {
            const prevCard = i > 0 ? cards[i - 1] : null;
            const nextCard = i < cards.length ? cards[i + 1] : null;

            const isDragging = draggedCardsIds.includes(card.id);
            const isDraggingPrevCard = !!prevCard && draggedCardsIds.includes(prevCard.id);
            const isDraggingNextCard = !!nextCard && draggedCardsIds.includes(nextCard.id);

            const shouldInsertLineOnLeft =
              !isDragging && !isDraggingPrevCard && hoveredCardIndex === i && insertIndex === i;
            const shouldInsertLineOnRight =
              !isDragging && !isDraggingNextCard && hoveredCardIndex === i && insertIndex === i + 1;

            const shouldInsertLineOnRightOfPrevCard =
              !!prevCard && !isDraggingPrevCard && hoveredCardIndex === i - 1 && insertIndex === i;
            const shouldInsertLineOnLeftOfNextCard =
              !!nextCard &&
              !isDraggingNextCard &&
              hoveredCardIndex === i + 1 &&
              insertIndex === i + 1;

            const isHovered =
              hoveredCardId === card.id ||
              shouldInsertLineOnRightOfPrevCard ||
              shouldInsertLineOnLeftOfNextCard;

            return (
              <div key={'card-div-' + card.id} style={{ position: 'relative' }}>
                {shouldInsertLineOnLeft && <div className="insert-line-left" />}
                <CardWrapper
                  key={'card-wrapper-' + card.id}
                  isDragging={isDragging}
                  isActive={activeCardId === card.id}
                  isHovered={isHovered}
                  isSelected={selectedCardsIds.includes(card.id)}
                >
                  <Card
                    key={'card-' + card.id}
                    id={card.id}
                    order={card.order}
                    url={card.url}
                    selectedCards={selectedCards}
                    onMove={this.onCardMove}
                    onDragStart={this.onCardDragStart}
                    onDragComplete={this.onCardDragComplete}
                    onSelectionChange={this.onCardSelectionChange}
                  />
                </CardWrapper>
                {shouldInsertLineOnRight && <div className="insert-line-right" />}
              </div>
            );
          })}
        </div>
      </main>
    );
  }
}
