<template>
  <div class="items">
    <div class="item active" id="elastico">
      <img
        src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHCBUWFRgWFhYYGBgaHB4ZGhgaGhgaHBgYHBwZGhgaGBgcIS4lHCErIRgYJjgmKy8xNTU1GiQ7QDs0Py40NTEBDAwMEA8QHxISHjQrJCs0NDY0NDQ0NDQ0NDQ0NDQ0NDQ0NjQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDE0NDQ0NDQ0NDQ0NP/AABEIAOEA4QMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAADBAIFBgABB//EAEQQAAEDAQQGBwQIBQQBBQAAAAEAAhEDBBIhMQUiQVFxgQYyYZGhscETstHwFEJSYnKCkuEjM6LC8RVDU9JzBxYkg5P/xAAaAQACAwEBAAAAAAAAAAAAAAABAgADBAUG/8QAKhEAAgEEAQQBBAIDAQAAAAAAAAECAxESMSEEE0FRMiJhcYEFobHB0UL/2gAMAwEAAhEDEQA/AKQ1lB1dKlyiXKwrGHVUN1RBLlEuUIFL1JrkEIjSoEPRGv8AP2XJ5lRzQTLQ2+7rXs8J6vLNIUOv3+4Uyx4vGXObidYGN+Y/dWR0CQppWqXQTd2dU4RJVa04JvSlQkSC5xw62e3tKSZMJZbItFloSxXjfcNUHAfad8AmdJPBfgZIEH8WOHLBVlnt1SLgcYi6AAJg7BhMozG3ZEydsZTtx2quKeV2FvghXyPBK2AazuATFXIpWwnWdwTvaItDq8ZmuJwXU0wpd6GZN7l6q5ZTVX0ebN/su/3K+DY2LLUf1MuiuCmttS6+OwIP0jePFF0oNfkEiU0dBHW2kEZFR6OfzqxBxFwz+cDbxSoJTHRYfxq3Bh/rYhP4kWzYe0eJyOFXZ2hPU3lzjln/AGJUjA8KnmE3R6/5h7ioHuGp1DhhuyP3TvXUX6owP1PeO5eMOXBnjIUaLsObfB7lAk3VhA/E3wepOrAg4jI++l6j4A+cnoVV4x4O98KEMx9EH2j3fuuXfSezxXK27AZMhRLUYtUS1aDOCuLy6iwvLqhAcL1qncUmsQIidn6/f7hTHtWAEFl43nGZAwwgZce9As/X7+eojsDnAgMvgEmATeExOAOWA2KyOgSENJOYSLggYSO3GUi3JP6Rdi0EBsYAAz9o4nfJKQbkhLZFosdCexbLqpM43QJw7SR89+BLfUpudNPqxHE7Y2qokJizO1eaSMebkaJVsjw9EDRTNd3BGq5HgmOjtdrHudAc6MJyaZEHime0FaAkL1ua8e7Fc0ogNN0YE3/y/wBy0bWSFlej1sZTa8vMTdgbT1pVtT0xeOq2N1458gsNaaUma6VGckrIPa6WOWwJGpRE9UdyNVtFRz5MDDYMPEyhWiq7sndBHqkjXhq5dLpaiV7AH2ZsHV80Dow0fSKg+6332JltqkER4/sl+jZ/+TUH3R77FofxuZpKzsbZzBjnk/aexEaNfAnrdn2EOo7P8/kvPaa44/2hUkCMecMRkzZ2ntUGPMZDPfueexQa/AcGe8V6w4Hi731AkK1bDI5O8HhDqWgY8HbO0FeWkYHsD/eCVqHPn5BREZS3lycudg7lytAZx1EqPsleOsoUDZRuV5QUvsl3s1bPs43IZohC5BBtJFZQTQpIzKaDYyRS0P5nN3urgXmQ0mBJgHnMcl5SfFTHaXR+lEs9R7CS1pM4TBIjHltV0dCSELW4uxJxG054A57ylBkj28uAmCJO6N6WblileyLQvOaesw1eaSY3M9qdoO1eaCCydXI8EPQ413cPVSq5Hh6KOinQ53BHyiLQUjFMMYAJOJXUKMkk5Dz3Lx1W8SB/gdqx1azfCN9Dp0llLfo42iPifRNWS37GCTtd6Deq20wOsOXxSjLUSdzRsGA571nxyRtyxZtbJabwJc66AJ7fkowYXN1QZ7FmbPbmgDGT4K90XbXPN0TEZjPks04NcmmE09ELPZHXzeIBAyzzP1hsU7AwUbQ973NuvAaCNjpZ1p2YZoVy5UO2c+HFeaRtkMIY1s5DIDxVsK0laK0U1+li05PZsXHE8T7qBWeQWxOzyVF0V0oXsDHHWafACI5Yd6uqxkt4BajjtWdgXt3jbsb4ORaVodG/rn+pDIw7veRrO3VP5/MKEuSrViQ7DY4eSG+mccsz7o7ExXbg7n5BEc3zPuKXIUd12/xXJ72S5NkQrQ9SaUkKqKyqtJUM3V4bPK8bVUmWvHqlK3YiR59FMgb0ZtkK42qSNU+CnZ3m8JO3aUraHUWYW2U7xiSDeJB3QAgB1SQPaTInEA+abdTLnEDDFxJ3AAJVvWH4QrFsregVWq+8GOcCOxrR5BSNOAo1f5o+diYq9U8Ey8gbK4UXu6oETGcJyhSc1sOz71PRwhp4/BGqmSjFcXI2L1RgULRpDb7jlgB2lHqjVKr2OlzGbJvHhn6Kqq+C2ivqLHSWkAxgaMCV5Z7exjRBx2kjGexZu3Wm+8u2TA4JmxEEiRJ8B8VncFY1xqty4LK11A7GSeAgcztVa9x4fO5XT6QjF2PYPkqttLADAz3JYtaLZJtXZ7ZHi8CfH0C2Whr7gS0RsndwCR6NdE31IfUBDdgX0ewWBjWNDGgAYR2jOVnrNN2RopNwV2U2jNEF7tbJu07TulZjpUyjQrPpvaTMObBjB2IjsGI5L6pZxAiIXzD/ANWKYFei/HWYW/odP96FKCuLUrSaforehlYCuWjInCeB/Zbwt6vBvmvl+gLa2i++QXERAGE4HM7Mwre19Iqz8AbjYAhucDe7PuhbVFs5tV2ka+2WylTGu4DPDM9bcMUzomq2swvY4tF5zQCOGOBXzO+ScTK3fQyp/Bje923cB8UZQxjcri7svzQJnXGO8HdG5ENM4Q5uc7vqxthQ9uImDkHbMih1KwnGc45xKqGPPYv+7+pvxXKHtB8grlAmL9pMFEY470vTGAR2eq1MrQ40wI2n0U6JkT8UFmJk7ch2I9MdiSTGQdnzmjtQKaKMikGMTVEmO108ggsOsPwjyClXM4bNaeQQqZ1h+EeQWhFDI1P5o+diZqnVPBKvP8QfOxMVsimXkD8EbCdU8T6Jh6TstS60gZk7U4116FFJWC0yPs72Cqrebr3x9kAcwFpLNRBPZkPUqn0/Zoe8j7I8BHos05pysaqVNqORnrJQc9wDQCcTjlAzJWr0BoFznEvAAG7I8El0QDfava7Bzmi72wZIHgeS29jhs7Ek5O9jVQpRxyez59pOtV9o9rIY1rnNDRnqkjE78E1/7cNSj7WlXFR2F5ggObvlsyCFpNN6FbVcXsIa85g9V/GMj2rNVuj1Yn+SXHe0tIPOfNOpRa4diipSqqTum19gFDS1ssZDWViMJLJDg3HAOa6bpOcDHEJyx9NLc5wayo1hcTrFogFxEl0yAOSsNHdB6z2zULKLdxh7v0tMDvVvX/8ATZ7GB9nqNqEjWpvAYTvuumORjilbpv02KlVS8pFNa9DaRrCs+013sZSYXl1RxDHERDGNaYl04YYqjrW+rUpU6VVxcaTnXXEyQ1wbLZzMFmHHgrMdHrQHBhs9eWmQ0teWNO8HqDjMJvTug/o1lYXx7V9WXAQbrbjtUHbGBPa5RyjwgxjJvLlLzcoKATAKXYYUw5XxVkZqkspB2lbjoZPsx+N3utWEYVuehbv4f/2H3AlqfEWOzQfV/Io1Cb27WHugLp1fyFRqnHmPJqosPcnrLl7K5QNzFUxgEdgQqeQTDFoYEMUx8+gU6f4jkvKY+dyasbJOMR2JJDI8p8UY5H53r2zMBdCnaWxeAy/ZIndjMwFYTnlrd8YIFPrDgPIJitGM5Q7hOwlKt63IeQWlGdnO/mD52I9Y6p4JV5/iD52JiqdUooDEafqrGyCRCQY6AmrO/BLa/A6dnct3WoMjsy+Kr7dpBhxImQRHEKut7nEyCVWPe7asip/Vyzo95KFkglpq4hzJaREEGCCNoKstEdI6jajRVdeacCTmNzlUEID24q6yfDM7lKLyTPqAtAzlHo2qDgvnmi9MOYA1xJbsO1vZ2haqw2proIIIKy1KbR0qNdTRpH2pzgLr2Nd9UOI8iRKv9A0bSGE1n4YwI4QQQcBnh2rCNotkwwOBznEnmZV5o6xCGlt+mWkEFrzMD6pGRB3EKhtLgslFteDR1LVslfLOmWkTVtBaDLKYuN3Xs3nvgflV30k6Shl6nTdL8nO+xw+95LDF0nNaempO+Uv0YOqqxSwj+ySm1DBRGlbjmsKwra9DKkMP/k/sWJYVseh51D/5B7hSVPiSOzSF4u/kcF5UeJ/T5tQZw/K/0Xjs+TfeCpHuPXRvC5eYLkoeDG08gj0/VLsyajUXxitBEPOIAx5otgqNvQPIpAVCWlMaMOvyVcmNEesbxfz3pi0vYQ6Xa0HDHclqLtfkfRL2l+u7n7qRKzDe6MfaCIM7nfslmnW5DyRa5zJ3OHfKA048h5LUilnjuv8AO5FqHApd3X+dyM84IoDE2eqcoCGpdjgAjsfggtkeiVRszkk32UZ+sJt51Sl7OQTg2TvMKuqvJpoS/wDIv9GOxBq2Yq7ujaO9e1qMsB+exUZ2NkaDncz4oHajUHObi0kdmw8U46guZZSdibJeQKi1oYsvSe71mkkbIj1Whs3SKrWb1RTZEDGXO7eweao3aKLQHOAPmE7ZhAWeooNcLk29HGTmnJ3SB27RDHyWarvA8Rs4hUL7O9ji14g+BG8Hataxy9tFlbUbdI4Ha07whSrODtLlGrrP4yFaLnT4f9MyQRGn5717aKBY4tdmPHcQoArpJ3V0eVnFwk4y2grD89y2HRB2o/8AG33CsbSMla/og7Uf+NvuuSz+II7NED5P8woPPk33kXd+fzCGTt+63zKoHGb5XLsNy5QJkmfVUxkh0/qhOsoNjFxlWt2IgM6pR9Gv1+Sh7OQQD3r2ytuPxIOGxIxkPU36/I+YSdofru5+6VJlXW5eoSdZ+u783ulC3IFoztc+TvVCYceQ8lOrEHg7xKE048loRUyJdr/O5FecCgka/wA7kV+RRRGLMTFMYJa+BHFMtdggtkeiTzqlItZuTjzgq99QjJGRIlmxhcQBtwVtWaIA2BLaKZm47MBx2o1ofAcdwKw1mssUej6GnjQc5bf+CeiLK15c53VxP5WA+srMVtJVKlSKeqHODWtESZMNknatVZn3WNA+yBxBEFVOhNCuFsZhLGkvDuxoJaDuMwkhKKcnLwuCrr6c0oYa829gukFrtLAxlRrWHrS0yXEYTnhnkrGw1b9Nj94x/EDBjmPFT6V6JqV64LXNAa0NxJmZLiYA+94KdOzimxtMGboxO8nEnvlCU4ypr2DoqdSNVt3tbyeNqQU5RqKqtZuweR9EzZqkquUeLnVo12pOLPOkNAENeNmB4HLx81QLV1ad9jmbxhx2LKEQtnSzvHF+Di/zNDCsprTX9k6YxWr6Kuhj/wAbP7lk2uWm6Kv1anFnm5Xz+Jx47NYx+XF/mgXsvwjzKG2oZH4neZQ3VIaCPsjzKoHLKVyS+kP3BcoEzj3wBsMKVqtLIaLzcBvHYsteJzJJ4rwgHYrGxlE1NmtjAx8vYDH2hjgV5YLUy91m5bwsqIC5yAbG0o1QXYGcPVK1367ufkVlQ6MsOCMy0PGTz3zxzUBbiweq/A8D5qDM0E1Tt+ZRGvHerIyVyuUWeOOuER5wQr2uiPyToVicZJyjklrwwTFN2CC2R6J1Miq2o0p+o8QRK8sVkL3tEGJkmMICk3ZXGpQc5qK2+C7szLrGjbEnmlbe/UI34J2s5JuspqYyAAYGGa50WnPKR6itGUafbpq7SsgNG1FoAgmBCYoaQE4GDxgrmaOIPWHcUlpB7ab2NcL2ILt92cQDnMAq+UKcvi+TnxqdVRSdWPGr3Lg2knG8T2yoFyrrZTu61N0sOI24dhUbOar8AOc4LOqatc2LqebW5+wxbzeaQJJzwxyxJ5RPJC0fWlW1ltFGytc+o4PqFpAYM4OwDYDtJWWsVpgjZv8A2TwWUWrcLT9marXwrxbe9r0bGzOVDpqy3HkjJ2PPb8eatLJUkKWmqN+mTtbrctvgq6MsKn5Oj11FdR0za2uV+jMgLSdGHQ2rxZ7xWcj571f9GG4VBOdz3iulP4nkls0rDJH4z6qAbgPwLmUzIxHWO/cVO4YGI6p37lnGDXQuXuK5Qh8/v2Zubi49yVe6mcG1CPytd44KJutJ1GkTgfaMGHaIUmVgMmj9bP8AsmLr3ItDP+R3/wCY+Ka9rSIiROd72bifeS7rQcg1sdr2T7yKKj/sgbuqR4OQs2FOKJtq0PrHiQxzT5lTDbMerUcOIBS9904ubwj9162i55wE9jac96ZUpAdSIapo2RqPa7+lKvsVRv1Ce0YjwXjm05i8wO27I7jHiitgf7o7/iU0YSW2VynF6TFGtdsn54pi8YxgIgYw5v8AEDyXooUt4PNWJWKm7imoM3dymK7djSeP7JtopDcvTaKY3IgAstrh1WAcldWN7rgc/N2MbhsVXTtTHOjZmexoEnwStm08S838QTgfs7h2hVV05RtE3/x1WnSq3mvHD9Mt7TUjicBzTLHQANyRszg6odoaJ7LzsvCe8KzuLBL6eD0NC87zT+wB1aFm9NVJrT90eq0dpYAs1pOleqjYIxPYM/NW0Plcw/yTlhi/YpTquxLSWt27u7ei09JPGAcY7vJL2mrODcghMbjlK1Sim+TiRqSjpl/o6rRLv4jWlu0BoBPMYpipZrI52pfpg5a14DvGSoA8gwRCdpVgpgnpjRrNSu0n+S9pNNN1wmdoO8K4pw5pHZ4LPWWrfbc+s3FnaNrPhwVpYLRksNaDi+dnpuirxnG3h6+3tFBXplji07DHnCu+jX+5+T3yvNO2K832jdnW7Rv5L3otm/gz31shUU4XPOdZ0zoVnHxtfg1NNuI/H6FeE4D8LlNuf5/7Shv6o4O9EpmDSuQPaLlLBPmh0VWOxg/MpWbQ1V7oAvD7ku8YgI1fpEB/Lpg/eqa3cwao53khadMWipg+o6PsjVbya2Ar4pLYG/Res0S1nXfTYfvODn9wmEKrarIzNz6p7NVvecVmvZOOwnvRaej6pyY/9JR7iWgYtllV060fy6DG9rpef6sPBI2nSNarg97iPsjBv6RATlm6P1HdYXR2n0zVvZtCsaAbzpHYyJ4OBVcqq9lkaLfgz9k0RVqdVuG84DvKZPRqvsDT+YLV4kRff/R/1UDSP/I8cmf9VV3ZF3ZRkn6AtA/2yeBB9UlVsdVvWY4cQVuzRd/yP7mfBSbRf/yO/Sz4KKq/JHR9Hzsz2rySvolawl3Wcw8abT4pB+gWHMt/Q7D+pMqyEdFmUoOuse7a7VHDN3olmpy3kB1xuTfjJ+exWFl6Puc1rnODb2MGZA2T87VZKSWyuMW9DeiazWUwD1jrHnkO6E4/SY2JR2han1XsdzI9EF+iq42A8HN9SFmcYyd2zrQ6qcIKMdIlWthJklVttqmMMynHaMr/AGDyLT5FL1nvo6r6YxBLS4Y9uO0Zd6tgopmSvVnJcnaM0Q6ocSGtHWcch2dpTdpr0aOrTAcdrj6KmdbnkReIG4YDuQsSnavsyXtoJarS55kqDKxC4hcCiuAD9ktt1wdORnuWpLA18jAHW+KyNls99waBiTH7q06QWku1WHVaIPbv9O5U1I5ySX7Ol0lfs0ZSftW/JbVdKybjIg4EkTPCUfo6IqVB2D3sFnrI681pWk0I3+I872NP9QVihGMWkY6/UTrzym/+I0238491CccOTvRTJx/MPdQKpw/X5hIUHXlyB7RciQw1K10G5Wdp4mfMFMf621uVJjeBA/tTP0F2x7eVOn6hT+gff/oYPRLdeTSotaB0+kLS0apnsjA8c1P/AF9mxru8fFTbYzlfcB+Uf2ov0Mf8j/1QPAJXiMlI8oaTc9pLWwAYxzyB2cVG02xwLNoJN7PKD3KT7IGjF74/8hCpbVbbriGveQCBF9xmRJOfLkjGKb4I5OK5LRukaZMDfGOAJjZiF6y0a3VeZgRddAzx7CqmzVLO3F4eSTMA5jbjOCtW2+yPJi+wYQ19R5GRk3rxOzLtUlC3sEZ39BbRaSz6jnYbPLqlKm32gTDMMxqvy71ZMpUyJbJByIe8yOw3lJtkYN/N7/O8kultD4vwVv8Aq9pH+3/Q/wCK60aZrXH32BggiYcMdwkq0ZZmY5/rf/2lZvpG4X20mSZgxec6XHAdYnenpqMnrQlTKK3srdH0nF1+4XgGS3HWOcYd6v29IcYfRc0bSJw4tcMe9O2TRtNjWi86YlxD3Nl20w13zARTZmZB1TDdUefXFSU4t8okISS4Z1nr0n9R7TvEQR+U4pk0zGAmOyUk+mwY3qn63nwlSpFjdriSB1nFwwyzyzSNeixP2HNUDrD9vXwS1uslKs26XHDFp3HsnNMtfj1WxyHeEvaJOLac8Log8ior3I3wZm06BqsJgB7d7ce8ZhJGiWraMqOacWieKlUtLXDXpNMb7vrin7j9FPaXh2MXSZJ2J2zaJc84Fu/EiY3xmr19joOM+zI7Wkj1VXQJbX1CS1rw0b8RBE8z3J1K+hcVF8llZ9GNY2A5wcc3NiY3DOAl6mhjENe13Y4R5K8LjtB5gKQY3cFSptGhwUlZmNo03UnupOzzG4g4iFpdG21lMB73XQRckgkSCCJjLBJ9JLCCwVWA3mdbPFv7HzK80O8O1TBBxjw+C0KWUbmWUMZYmqo2+m/qPY7WGTgTluzRRiRxd5rPVNDUXYlkHeJb7sKLdEOYb1Gu9ju03hwgqpTiO6Ei+gbh3Beqg+jW3/nb+hvwXI5R9i9mXoQdanH6vipttW/BJB5O1TBJz9Ezih1Nlgy0t+14FT+nMG08gVXhx7O4Kbax2R88kjgOqg2dJs+y7u/dV+l9LNey41sYiTGwY4c4TJqGMh3BDc87h+kIxik7glJtW/0U9Cs0EFzA6PHwRbbbmPcLtFrI3HPkAE44E7hyCXqU43d21W3KWjrHb7sgtnGc8k4zSEkAMknIAkk8AAlmPaBFwfi6xJ3XTgOMoZtVQCW6hyhogx2xgP8AKmMXsnckuC8uOYBfZdLuqwGXkb3fYHHHsVVbSRXNRzIgao2bcRwnySzqtZ2Jd3kyfxRn3ozbS7Ko1rmbboLXDtacpT2jayFcpNpsYGkx9nx/ZT/1Jv2fH9lVVGgE3ZI2E4eCgSq3FFqqSLgaTZ2+BUxpFm890KjgKLmoYInckXotjNjhzlEbaWGNYQNxGHCeJWebSJylEFledhQcV7Bm/RetqlskOBOESSYHKI8VP6eANZxnsn/KpqVicMTgn6VAZXWzzE88krSRZG7DvtrS0lpmMdipdG1jex2vvExOOImOasHWAEyBHrzCh9BLDsiMD2zO1GMopCSjJ8lyx4jBwPDVnkistE/WjsKpHPfem84DdnO/hxTF92wyJ2Q66TBun4neksi1SsW/tbwIMFpBBG8HMKg0Y0seWHEsdA7WnqnyU3VHjZBAkyMSN4iMY2DcUu6rcqB7pALdYnvaRv2hPTjZ29ldWWVn6NWbQfsjkSvHVvuqnbanvcXUw0tONyTLZxMbxyTlG1BwmCNkYeiqlTxZdGqpDvtuPcVyX9tx8FyWw+ZUtsbsgApCyuCtmlwwXjw4n6veE3cZX2kV1Ozn5hHbZzuA7vgn/Yn7LSd8DzUHU9k47xihncbt2FhRGSkyyjs8Uf2A2S7jgomlty7z5oZfcOP2APoDcFH6KDgQIKm844klSBnKeKa7BZCRs7WktOMbd42FTFBg2BMVrLI1ZLhiM+Y5/BCpsBE4Yo5X8kx+wJzGA4gKPs6ZwAlMG6MIJPYPQogbGTR6+SlwYla+yMnI9/xXrbAwndxOPhgnxZyTs4f5XlopBjC50ADMhHLxcGC20VjrMwHBgI7Z9F79GYfqNHMolCq1zhdOfaMe5WLaTSMY4jAoylYCinoqjZae4jn6rhZWfZPeVYvszRkSew/5Xr6JGByjs9EuQcfsV7bK37/J3xQfZies8DiMB8yrNtJ5wAnkJ5LnWdpIkEnLGD4FTIjiVbmOBwecs4bl2hEL3AZkmcCAMRujf24L21tDGk7RkMicdsBBstpa+L2GeyN+Z2prcXK/Nh1jHls3h2kAyPHBe+xAbDasOOYDXDmSD2rx9maIzHbltyBhTdTaQNbZnOaUawGpZ3sbJIMDqtMEiMxOaVqMFRolrow6olxxx6zoGe/uTjrC45DA7ATHGZU6tjfcuEjA5homMLwwMA8d6eMkhJQbK9zgwTcfdzBhodA2kB5IUqemwfrE9pAnmf3T9ms3W1g65kSNg+q7cTx2HNSfZqbiXtuy43Sxsbd93AHJN3b7Qvafgr/9Rb8/5XJn/SPus/SPiuRzj6JhIvqnWKgM1y5ZEbCbV7TzXLkqG9E3ZodZcuUWyPRVO63JOHqtXLla/BSvJ47NV7M3fjd5rlykRnsNTzUzkvVyJEeMSmm/5TvnaFy5CPyQsviyt0N12fOxa6ltXLk9QSlo52XJBtXVXLlWix6J2HrlBtnWHELlyMfkyPSE7X1jz80ic+RXLlbH4lT+Qw/McB5JB3WeuXILRHsbpbeXmrayfy/0+8vVyRjoBaeoeLfIKr/3m8PiuXJkJ5Rbrly5IOf/2Q=="
      />
      <div class="info">
        <h4>Elastico</h4>
        <p>Every 10 rounds, a bigger bar during 3 rounds</p>
      </div>
    </div>

    <div class="item next" id="minimo">
      <img
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8UbSnEJjZLWg0Td-_RZa63KTQFXpeF0ZYFg&usqp=CAU"
      />
      <div class="info">
        <h4>Minimo</h4>
        <p>Every 12 rounds, a smaller bar for your opponent during 3 rounds</p>
      </div>
    </div>
    <div class="item" id="sticky">
      <img
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcckV2PYYCqKqaYipL1_sAw_7Ed-Mns67VZA&usqp=CAU"
      />
      <div class="info">
        <h4>Sticky Fingers</h4>
        <p>Every 6 rounds, the ball sticks to your paddle for 3 seconds</p>
      </div>
    </div>
    <div class="item" id="invisibility">
      <img
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPeJtx4XRsq2Kth9ZK7XhpqfY_SFak91dBqg&usqp=CAU"
      />
      <div class="info">
        <h4>Invisibility</h4>
        <p>
          Every 6 rounds, the ball becomes invisible for your opponent during 2
          seconds
        </p>
      </div>
    </div>
    <div class="item prev" id="blinder">
      <img
        src="https://img.freepik.com/premium-vector/blind-man-with-stick_10045-150.jpg?w=1800"
      />
      <div class="info">
        <h4>Blinder</h4>
        <p>
          Every 10 rounds, your field part becomes invisible to your opponent
        </p>
      </div>
    </div>
    <div class="button-container">
      <div class="button">
        <font-awesome-icon icon="fa-solid fa-arrow-left" />
      </div>
      <div class="button">
        <font-awesome-icon icon="fa-solid fa-arrow-right" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { config } from "@fortawesome/fontawesome-svg-core";
import { onMounted } from "vue";
import "./style.css";

const emit = defineEmits(["update:modelValue"]);
let current = 0;

onMounted(() => {
  // I will be creating a different pen with touch support but right // now I have no time for it due to school

  const slider = document.querySelector(".items");
  const slides = document.querySelectorAll(".item");
  const button = document.querySelectorAll(".button");

  const number_of_powers = slides.length;
  let prev = number_of_powers - 1;
  let next = 1;

  // To activate default power if none selected:
  emit("update:modelValue", slides[current].id);

  for (let i = 0; i < button.length; i++) {
    button[i].addEventListener("click", () =>
      i == 0 ? gotoPrev() : gotoNext()
    );
  }

  const gotoPrev = () =>
    current > 0 ? gotoNum(current - 1) : gotoNum(slides.length - 1);

  const gotoNext = () => (current < 4 ? gotoNum(current + 1) : gotoNum(0));

  const gotoNum = (number: number) => {
    current = number;
    prev = current - 1;
    next = current + 1;

    for (let i = 0; i < slides.length; i++) {
      slides[i].classList.remove("active");
      slides[i].classList.remove("prev");
      slides[i].classList.remove("next");
    }

    if (next == 5) {
      next = 0;
    }

    if (prev == -1) {
      prev = 4;
    }

    slides[current].classList.add("active");
    //config.json: activePower = slides[current]
    slides[prev].classList.add("prev");
    slides[next].classList.add("next");
    emit("update:modelValue", slides[current].id);
  };
});
</script>
